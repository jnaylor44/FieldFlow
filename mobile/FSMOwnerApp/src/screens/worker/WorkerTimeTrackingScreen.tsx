import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  Alert,
  RefreshControl,
  Modal
} from 'react-native';
import { Clock, Play, Pause, BookOpen, Briefcase, CheckCircle } from 'lucide-react-native';
import client from '../../api/client';

const TIME_ENTRY_TYPES = {
  work: { icon: Briefcase, color: '#4F46E5', label: 'Work' },
  break: { icon: BookOpen, color: '#F59E0B', label: 'Break' },
  travel: { icon: Clock, color: '#10B981', label: 'Travel' }
};

const WorkerTimeTrackingScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTimeEntry, setActiveTimeEntry] = useState(null);
  const [todaysEntries, setTodaysEntries] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [timeSince, setTimeSince] = useState('00:00:00');
  const [isJobModalVisible, setJobModalVisible] = useState(false);
  const [selectedEntryType, setSelectedEntryType] = useState('work');

  useEffect(() => {
    loadTimeData();
  }, []);

  useEffect(() => {
    let interval = null;
    if (activeTimeEntry) {
      interval = setInterval(() => {
        const startTime = new Date(activeTimeEntry.start_time).getTime();
        const elapsed = Date.now() - startTime;
        const hours = Math.floor(elapsed / (1000 * 60 * 60));
        const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);
        
        setTimeSince(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [activeTimeEntry]);

  const loadTimeData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const activeResponse = await client.get('/time-entries/active');
      if (activeResponse.data) {
        setActiveTimeEntry(activeResponse.data);
      }
      const entriesResponse = await client.get('/time-entries', {
        params: { date: today }
      });
      setTodaysEntries(entriesResponse.data);
      const jobsResponse = await client.get('/jobs', {
        params: {
          status: ['scheduled', 'in_progress'],
          date: today
        }
      });
      setAvailableJobs(jobsResponse.data);
      
    } catch (error) {
      console.error('Error loading time data:', error);
      Alert.alert('Error', 'Failed to load time tracking data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTimeData();
  };

  const startTimeEntry = async (jobId) => {
    try {
      const response = await client.post('/time-entries', {
        job_id: jobId,
        entry_type: selectedEntryType
      });
      
      setActiveTimeEntry(response.data);
      setJobModalVisible(false);
      loadTimeData(); // Refresh the list
    } catch (error) {
      console.error('Error starting time entry:', error);
      Alert.alert('Error', 'Failed to start time entry');
    }
  };

  const stopTimeEntry = async () => {
    try {
      await client.put(`/time-entries/${activeTimeEntry.id}/stop`);
      setActiveTimeEntry(null);
      setTimeSince('00:00:00');
      loadTimeData(); // Refresh the list
    } catch (error) {
      console.error('Error stopping time entry:', error);
      Alert.alert('Error', 'Failed to stop time entry');
    }
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '00:00';
    
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const durationMs = end - start;
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const renderTimeEntryItem = ({ item }) => {
    const typeConfig = TIME_ENTRY_TYPES[item.entry_type] || TIME_ENTRY_TYPES.work;
    const TypeIcon = typeConfig.icon;
    
    return (
      <View style={styles.entryCard}>
        <View style={[styles.entryTypeIcon, { backgroundColor: `${typeConfig.color}20` }]}>
          <TypeIcon size={20} color={typeConfig.color} />
        </View>
        
        <View style={styles.entryDetails}>
          <Text style={styles.entryJobTitle}>{item.job?.title || 'Unknown Job'}</Text>
          
          <View style={styles.entryRow}>
            <Text style={styles.entryType}>{typeConfig.label}</Text>
            <Text style={styles.entryTime}>
              {new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {' - '}
              {item.end_time 
                ? new Date(item.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'In Progress'}
            </Text>
          </View>
          
          {item.end_time && (
            <Text style={styles.entryDuration}>
              {formatDuration(item.start_time, item.end_time)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Active Timer Section */}
      <View style={styles.timerSection}>
        {activeTimeEntry ? (
          <View style={styles.activeTimerContainer}>
            <Text style={styles.activeTimerLabel}>Time Tracking In Progress</Text>
            <Text style={styles.activeTimerJob}>{activeTimeEntry.job?.title || 'Unknown Job'}</Text>
            
            <View style={styles.timerDisplay}>
              <Text style={styles.timerText}>{timeSince}</Text>
            </View>
            
            <View style={styles.timerTypeContainer}>
              <TypeBadge type={activeTimeEntry.entry_type} />
            </View>
            
            <TouchableOpacity 
              style={styles.stopButton}
              onPress={stopTimeEntry}
            >
              <Pause size={20} color="white" />
              <Text style={styles.stopButtonText}>Stop Timer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.startTimerContainer}>
            <Text style={styles.startTimerTitle}>Start Time Tracking</Text>
            <Text style={styles.startTimerSubtitle}>Track your work, breaks, and travel time</Text>
            
            <TouchableOpacity 
              style={styles.startButton}
              onPress={() => setJobModalVisible(true)}
            >
              <Play size={20} color="white" />
              <Text style={styles.startButtonText}>Start Timer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Today's Entries */}
      <View style={styles.entriesSection}>
        <Text style={styles.sectionTitle}>Today's Time Entries</Text>
        
        {loading && todaysEntries.length === 0 ? (
          <ActivityIndicator size="large" color="#4F46E5" style={styles.loader} />
        ) : (
          <FlatList
            data={todaysEntries}
            renderItem={renderTimeEntryItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.entriesList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No time entries for today</Text>
              </View>
            }
          />
        )}
      </View>
      
      {/* Job Selection Modal */}
      <Modal
        visible={isJobModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setJobModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Job & Entry Type</Text>
              <TouchableOpacity
                onPress={() => setJobModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.entryTypeSelector}>
              {Object.entries(TIME_ENTRY_TYPES).map(([type, config]) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.entryTypeButton,
                    selectedEntryType === type && styles.selectedEntryType,
                    { borderColor: selectedEntryType === type ? config.color : '#E5E7EB' }
                  ]}
                  onPress={() => setSelectedEntryType(type)}
                >
                  <config.icon size={18} color={config.color} />
                  <Text style={styles.entryTypeText}>{config.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.jobsListTitle}>Select a job:</Text>
            <FlatList
              data={availableJobs}
              keyExtractor={(item) => item.id}
              style={styles.jobsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.jobItem}
                  onPress={() => startTimeEntry(item.id)}
                >
                  <Text style={styles.jobItemTitle}>{item.title}</Text>
                  <View style={styles.jobItemDetails}>
                    <Text style={styles.jobItemCustomer}>{item.customer?.name || 'No customer'}</Text>
                    <View style={[
                      styles.jobItemStatus,
                      { backgroundColor: item.status === 'in_progress' ? '#DBEAFE' : '#E0E7FF' }
                    ]}>
                      <Text style={[
                        styles.jobItemStatusText,
                        { color: item.status === 'in_progress' ? '#2563EB' : '#4F46E5' }
                      ]}>
                        {item.status === 'in_progress' ? 'In Progress' : 'Scheduled'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.noJobsText}>No available jobs for today</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const TypeBadge = ({ type }) => {
  const config = TIME_ENTRY_TYPES[type] || TIME_ENTRY_TYPES.work;
  const TypeIcon = config.icon;
  
  return (
    <View style={[styles.typeBadge, { backgroundColor: `${config.color}20` }]}>
      <TypeIcon size={14} color={config.color} />
      <Text style={[styles.typeBadgeText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  timerSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activeTimerContainer: {
    alignItems: 'center',
    padding: 16,
  },
  activeTimerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 4,
  },
  activeTimerJob: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 16,
  },
  timerDisplay: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  timerText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4F46E5',
  },
  timerTypeContainer: {
    marginBottom: 24,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  stopButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  startTimerContainer: {
    alignItems: 'center',
    padding: 16,
  },
  startTimerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  startTimerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  startButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  entriesSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  loader: {
    marginTop: 32,
  },
  entriesList: {
    paddingBottom: 16,
  },
  entryCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  entryTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  entryDetails: {
    flex: 1,
  },
  entryJobTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  entryType: {
    fontSize: 12,
    color: '#6B7280',
  },
  entryTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  entryDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  entryTypeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  entryTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
  },
  selectedEntryType: {
    backgroundColor: '#F5F3FF',
    borderWidth: 2,
  },
  entryTypeText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  jobsListTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 12,
  },
  jobsList: {
    maxHeight: 300,
  },
  jobItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  jobItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  jobItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobItemCustomer: {
    fontSize: 12,
    color: '#6B7280',
  },
  jobItemStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  jobItemStatusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  noJobsText: {
    textAlign: 'center',
    padding: 16,
    color: '#9CA3AF',
  },
});

export default WorkerTimeTrackingScreen;
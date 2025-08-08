import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import ReportGenerator from '../../components/reports/ReportGenerator';
import ReportList from '../../components/reports/ReportList';
import ReportView from '../../components/reports/ReportView';
import client from '../../api/client';

const WorkerJobDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { jobId } = route.params as { jobId: string };
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusAction, setStatusAction] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReportList, setShowReportList] = useState(false);
  const [showReportView, setShowReportView] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [reportsCount, setReportsCount] = useState(0);

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);
  useEffect(() => {
    if (job) {
      fetchReportsCount();
    }
  }, [job]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await client.get(`/jobs/${jobId}`);
      setJob(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching job details:', err);
      setError('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };
  const fetchReportsCount = async () => {
    try {
      if (!job) return;
      
      const response = await client.get('/reports', {
        params: { job_id: jobId }
      });
      
      setReportsCount(response.data.reports?.length || 0);
    } catch (err) {
      console.error('Error fetching reports count:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStartJob = async () => {
    try {
      setStatusAction('starting');
      await api.post(`/jobs/${jobId}/start`);
      await fetchJobDetails(); // Refresh job data
    } catch (err) {
      console.error('Error starting job:', err);
      Alert.alert('Error', 'Failed to start job');
    } finally {
      setStatusAction(null);
    }
  };

  const handleCompleteJob = async () => {
    try {
      setStatusAction('completing');
      await api.post(`/jobs/${jobId}/complete`);
      await fetchJobDetails(); // Refresh job data
    } catch (err) {
      console.error('Error completing job:', err);
      Alert.alert('Error', 'Failed to complete job');
    } finally {
      setStatusAction(null);
    }
  };
  const handleCreateReport = () => {
    setShowReportModal(true);
  };
  
  const handleReportCreated = (newReport) => {
    setShowReportModal(false);
    fetchReportsCount(); // Refresh reports count
    Alert.alert('Success', 'Report created successfully');
  };
  
  const handleViewReport = (reportId) => {
    setSelectedReportId(reportId);
    setShowReportView(true);
  };
  
  const handleBackFromReportView = () => {
    setShowReportView(false);
    setSelectedReportId(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Loading job details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchJobDetails}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No job data found</Text>
      </View>
    );
  }
  if (showReportList) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#1976d2" barStyle="light-content" />
        <ReportList 
          jobId={jobId} 
          onViewReport={handleViewReport} 
          onCreateReport={handleCreateReport}
          onBack={() => setShowReportList(false)}
        />
      </SafeAreaView>
    );
  }
  if (showReportView && selectedReportId) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#1976d2" barStyle="light-content" />
        <ReportView 
          reportId={selectedReportId} 
          onBack={handleBackFromReportView}
        />
      </SafeAreaView>
    );
  }
  const getStatusColor = (status) => {
    const colors = {
      draft: '#E0E0E0',
      scheduled: '#BBDEFB',
      in_progress: '#FFE082',
      completed: '#C8E6C9',
      cancelled: '#FFCDD2'
    };
    return colors[status] || '#E0E0E0';
  };
  const getStatusTextColor = (status) => {
    const colors = {
      draft: '#424242',
      scheduled: '#1565C0',
      in_progress: '#F57F17',
      completed: '#2E7D32',
      cancelled: '#C62828'
    };
    return colors[status] || '#424242';
  };
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1976d2" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={{ width: 24 }} /> {/* Empty view for balanced header */}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Job Title and Status */}
        <View style={styles.titleContainer}>
          <View>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <Text style={styles.jobId}>Job #{job.id.substring(0, 8)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
            <Text style={[styles.statusText, { color: getStatusTextColor(job.status) }]}>
              {job.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        {/* Action Buttons - Worker can only start/complete, not edit or assign */}
        <View style={styles.actionButtonsContainer}>
          {job.status === 'scheduled' && (
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={handleStartJob}
              disabled={statusAction === 'starting'}
            >
              {statusAction === 'starting' ? (
                <View style={styles.actionButtonContent}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.actionButtonText}>Starting...</Text>
                </View>
              ) : (
                <View style={styles.actionButtonContent}>
                  <MaterialIcons name="play-arrow" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Start Job</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          
          {job.status === 'in_progress' && (
            <TouchableOpacity
              style={[styles.primaryActionButton, { backgroundColor: '#4CAF50' }]}
              onPress={handleCompleteJob}
              disabled={statusAction === 'completing'}
            >
              {statusAction === 'completing' ? (
                <View style={styles.actionButtonContent}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.actionButtonText}>Completing...</Text>
                </View>
              ) : (
                <View style={styles.actionButtonContent}>
                  <MaterialIcons name="check-circle" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Complete Job</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Basic Job Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Job Information</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <View style={styles.infoRow}>
                <MaterialIcons name="person" size={18} color="#666" style={styles.infoIcon} />
                <View>
                  <Text style={styles.infoLabel}>Customer</Text>
                  <Text style={styles.infoValue}>{job.customer_name}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.infoRow}>
                <MaterialIcons name="event" size={18} color="#666" style={styles.infoIcon} />
                <View>
                  <Text style={styles.infoLabel}>Scheduled</Text>
                  <Text style={styles.infoValue}>{formatDate(job.scheduled_start)}</Text>
                </View>
              </View>
            </View>

            {job.location && (
              <View style={styles.infoItem}>
                <View style={styles.infoRow}>
                  <MaterialIcons name="location-on" size={18} color="#666" style={styles.infoIcon} />
                  <View>
                    <Text style={styles.infoLabel}>Location</Text>
                    <Text style={styles.infoValue}>{job.location}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
          
          {job.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionLabel}>Description</Text>
              <Text style={styles.descriptionText}>{job.description}</Text>
            </View>
          )}
        </View>
        
        {/* NEW: Reports Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reports</Text>
            <TouchableOpacity 
              style={styles.sectionAction}
              onPress={handleCreateReport}
            >
              <MaterialIcons name="note-add" size={16} color="#1976d2" />
              <Text style={styles.sectionActionText}>Create Report</Text>
            </TouchableOpacity>
          </View>
          
          {reportsCount > 0 ? (
            <TouchableOpacity 
              style={styles.viewReportsButton}
              onPress={() => setShowReportList(true)}
            >
              <MaterialIcons name="description" size={20} color="#1976d2" />
              <Text style={styles.viewReportsText}>
                View {reportsCount} {reportsCount === 1 ? 'Report' : 'Reports'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptySection}>
              <MaterialIcons name="description" size={36} color="#ccc" />
              <Text style={styles.emptySectionText}>No reports created yet</Text>
            </View>
          )}
        </View>

        {/* Notes Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <TouchableOpacity style={styles.sectionAction}>
              <MaterialIcons name="add-comment" size={16} color="#1976d2" />
              <Text style={styles.sectionActionText}>Add Note</Text>
            </TouchableOpacity>
          </View>
          
          {job.notes && job.notes.length > 0 ? (
            <View style={styles.notesList}>
              {job.notes.map((note, index) => (
                <View key={note.id || index} style={styles.noteItem}>
                  <View style={styles.noteHeader}>
                    <Text style={styles.noteAuthor}>{note.user_name}</Text>
                    <Text style={styles.noteDate}>
                      {new Date(note.created_at).toLocaleString()}
                    </Text>
                  </View>
                  <Text style={styles.noteText}>{note.note}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptySection}>
              <MaterialIcons name="comment" size={36} color="#ccc" />
              <Text style={styles.emptySectionText}>No notes added yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Report Generator Modal */}
      <Modal
        visible={showReportModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowReportModal(false)}
      >
        <ReportGenerator 
          jobId={jobId}
          customerId={job.customer_id} 
          onComplete={handleReportCreated}
          onCancel={() => setShowReportModal(false)}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1976d2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
    flex: 1,
  },
  jobId: {
    fontSize: 14,
    color: '#757575',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  primaryActionButton: {
    backgroundColor: '#1976d2',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItem: {
    width: '50%',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: '#757575',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  descriptionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  descriptionLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionActionText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
    marginLeft: 4,
  },
  emptySection: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    padding: 24,
  },
  emptySectionText: {
    marginTop: 8,
    fontSize: 14,
    color: '#757575',
  },
  notesList: {
    marginTop: 8,
  },
  noteItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  noteAuthor: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  noteDate: {
    fontSize: 11,
    color: '#757575',
  },
  noteText: {
    fontSize: 14,
    color: '#555',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#c62828',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#ffebee',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#c62828',
    fontWeight: '500',
  },
  viewReportsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f4fd',
    padding: 12,
    borderRadius: 4,
  },
  viewReportsText: {
    color: '#1976d2',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 8,
  }
});

export default WorkerJobDetailScreen;
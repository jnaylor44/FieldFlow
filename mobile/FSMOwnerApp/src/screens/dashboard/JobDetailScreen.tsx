

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
import { AssignJobModal } from '../components/jobs/AssignJobModal';
import { EditJobModal } from '../components/jobs/EditJobModal';
import ReportGenerator from '../../components/reports/ReportGenerator';
import ReportList from '../../components/reports/ReportList';
import ReportView from '../../components/reports/ReportView';
import client from '../../api/client';
interface Job {
  id: string;
  title: string;
  status: 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  customer_name: string;
  customer_id: string; // Added customer_id
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  location?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description?: string;
  estimated_hours?: number;
  assigned_user_id?: string;
  assigned_user_name?: string;
  created_at: string;
  photos?: any[];
  notes?: any[];
  timeEntries?: any[];
}

const JobDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { jobId } = route.params as { jobId: string };
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusAction, setStatusAction] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReportList, setShowReportList] = useState(false);
  const [showReportView, setShowReportView] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
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

  type StatusType = 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

  const getStatusColor = (status: string) => {
    const colors: Record<StatusType, string> = {
      draft: '#E0E0E0',
      scheduled: '#BBDEFB',
      in_progress: '#FFE082',
      completed: '#C8E6C9',
      cancelled: '#FFCDD2'
    };
    return colors[status as StatusType] || '#E0E0E0';
  };

  const getStatusTextColor = (status: string) => {
    const colors: Record<StatusType, string> = {
      draft: '#424242',
      scheduled: '#1565C0',
      in_progress: '#F57F17',
      completed: '#2E7D32',
      cancelled: '#C62828'
    };
    return colors[status as StatusType] || '#424242';
  };
  
  type PriorityType = 'low' | 'medium' | 'high' | 'urgent';
  const getPriorityColor = (priority: string) => {
    const colors: Record<PriorityType, string> = {
      low: '#757575',
      medium: '#1976D2',
      high: '#F57C00',
      urgent: '#D32F2F'
    };
    return colors[priority as PriorityType] || '#757575';
  };

  const formatDate = (dateString?: string) => {
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

  const handleJobUpdated = (updatedJob: any) => {
    setJob({ ...job, ...updatedJob } as Job);
  };
  const handleCreateReport = () => {
    setShowReportModal(true);
  };
  
  const handleReportCreated = (newReport: any) => {
    setShowReportModal(false);
    fetchReportsCount(); // Refresh reports count
    Alert.alert('Success', 'Report created successfully');
  };
const handleViewReport = (reportId) => {
  setSelectedReportId(reportId);
  setTimeout(() => {
    setShowReportView(true);
    setShowReportList(false); // Hide the list view
  }, 50); // Small delay to ensure state updates properly
};
const handleBackFromReportView = () => {
  setShowReportView(false);
  setSelectedReportId(null);
  setShowReportList(true); // Go back to the list
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

        {/* Action Buttons */}
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
          
          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={() => setShowAssignModal(true)}
          >
            <View style={styles.actionButtonContent}>
              <MaterialIcons name="person-add" size={18} color="#3F51B5" />
              <Text style={styles.secondaryActionButtonText}>
                {job.assigned_user_id ? 'Reassign' : 'Assign'}
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={() => setShowEditModal(true)}
          >
            <View style={styles.actionButtonContent}>
              <MaterialIcons name="edit" size={18} color="#3F51B5" />
              <Text style={styles.secondaryActionButtonText}>Edit</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Job Information */}
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
            
            <View style={styles.infoItem}>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons 
                  name="flag-outline" 
                  size={18} 
                  color={getPriorityColor(job.priority)} 
                  style={styles.infoIcon} 
                />
                <View>
                  <Text style={styles.infoLabel}>Priority</Text>
                  <Text style={[styles.infoValue, { color: getPriorityColor(job.priority) }]}>
                    {job.priority.charAt(0).toUpperCase() + job.priority.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.infoRow}>
                <MaterialIcons name="person" size={18} color="#666" style={styles.infoIcon} />
                <View>
                  <Text style={styles.infoLabel}>Assigned To</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.infoValue}>{job.assigned_user_name || 'Unassigned'}</Text>
                    <TouchableOpacity onPress={() => setShowAssignModal(true)}>
                      <Text style={styles.changeLink}>Change</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.infoRow}>
                <MaterialIcons name="schedule" size={18} color="#666" style={styles.infoIcon} />
                <View>
                  <Text style={styles.infoLabel}>Estimated Hours</Text>
                  <Text style={styles.infoValue}>{job.estimated_hours || 'Not specified'}</Text>
                </View>
              </View>
            </View>
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

        {/* Photos Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <TouchableOpacity style={styles.sectionAction}>
              <MaterialIcons name="camera-alt" size={16} color="#1976d2" />
              <Text style={styles.sectionActionText}>Upload Photo</Text>
            </TouchableOpacity>
          </View>
          
          {job.photos && job.photos.length > 0 ? (
            <View style={styles.photosGrid}>
              {job.photos.map((photo, index) => (
                <TouchableOpacity 
                  key={photo.id || index}
                  style={styles.photoItem}
                >
                  {/* This would be an Image component in a real app */}
                  <View style={styles.photoPlaceholder}>
                    <MaterialIcons name="photo" size={36} color="#ccc" />
                  </View>
                  <Text style={styles.photoCaption} numberOfLines={1}>
                    {photo.caption || 'No caption'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptySection}>
              <MaterialIcons name="photo-library" size={36} color="#ccc" />
              <Text style={styles.emptySectionText}>No photos uploaded yet</Text>
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

        {/* Time Tracking */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Time Tracking</Text>
          
          {job.timeEntries && job.timeEntries.length > 0 ? (
            <View style={styles.timeEntriesList}>
              {job.timeEntries.map((entry, index) => (
                <View key={entry.id || index} style={styles.timeEntryItem}>
                  <View>
                    <Text style={styles.timeEntryType}>
                      {entry.entry_type.charAt(0).toUpperCase() + entry.entry_type.slice(1)}
                    </Text>
                    <Text style={styles.timeEntryUser}>{entry.user_name}</Text>
                  </View>
                  <View style={styles.timeEntryTimes}>
                    <Text style={styles.timeEntryStart}>
                      {new Date(entry.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {entry.end_time && (
                      <Text style={styles.timeEntryEnd}>
                        to {new Date(entry.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptySectionText}>No time entries recorded</Text>
          )}
          
          {job.status === 'in_progress' && (
            <TouchableOpacity style={styles.timeTrackingButton}>
              <MaterialIcons name="timer" size={16} color="#1976d2" />
              <Text style={styles.timeTrackingButtonText}>Record Time Entry</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Status History */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Status Updates</Text>
          
          <View style={styles.statusUpdatesList}>
            <View style={styles.statusUpdateItem}>
              <View style={styles.statusUpdateIcon}>
                <MaterialIcons name="check-circle" size={16} color="#1976d2" />
              </View>
              <View>
                <Text style={styles.statusUpdateTitle}>Job created</Text>
                <Text style={styles.statusUpdateDate}>{formatDate(job.created_at)}</Text>
              </View>
            </View>
            
            {job.actual_start && (
              <View style={styles.statusUpdateItem}>
                <View style={styles.statusUpdateIcon}>
                  <MaterialIcons name="check-circle" size={16} color="#1976d2" />
                </View>
                <View>
                  <Text style={styles.statusUpdateTitle}>Job started</Text>
                  <Text style={styles.statusUpdateDate}>{formatDate(job.actual_start)}</Text>
                </View>
              </View>
            )}
            
            {job.actual_end && (
              <View style={styles.statusUpdateItem}>
                <View style={styles.statusUpdateIcon}>
                  <MaterialIcons name="check-circle" size={16} color="#1976d2" />
                </View>
                <View>
                  <Text style={styles.statusUpdateTitle}>Job completed</Text>
                  <Text style={styles.statusUpdateDate}>{formatDate(job.actual_end)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      {showAssignModal && (
        <AssignJobModal 
          visible={showAssignModal}
          job={job}
          onClose={() => setShowAssignModal(false)}
          onJobAssigned={handleJobUpdated}
        />
      )}

      {showEditModal && (
        <EditJobModal 
          visible={showEditModal}
          job={job}
          onClose={() => setShowEditModal(false)}
          onJobUpdated={handleJobUpdated}
        />
      )}
      
      {/* Report Generator Modal */}
      <Modal
        visible={showReportModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowReportModal(false)}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ReportGenerator 
            jobId={jobId}
            customerId={job.customer_id} 
            onComplete={handleReportCreated}
            onCancel={() => setShowReportModal(false)}
          />
        </SafeAreaView>
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
  secondaryActionButton: {
    backgroundColor: '#E3F2FD',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
  secondaryActionButtonText: {
    color: '#3F51B5',
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
  changeLink: {
    fontSize: 12,
    color: '#1976d2',
    marginLeft: 8,
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
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -4,
  },
  photoItem: {
    width: '33.33%',
    padding: 4,
  },
  photoPlaceholder: {
    backgroundColor: '#f5f5f5',
    height: 100,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  photoCaption: {
    fontSize: 12,
    color: '#555',
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
  timeEntriesList: {
    marginTop: 8,
  },
  timeEntryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timeEntryType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  timeEntryUser: {
    fontSize: 12,
    color: '#757575',
  },
  timeEntryTimes: {
    alignItems: 'flex-end',
  },
  timeEntryStart: {
    fontSize: 14,
    color: '#333',
  },
  timeEntryEnd: {
    fontSize: 12,
    color: '#757575',
  },
  timeTrackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f7ff',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  timeTrackingButtonText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
    marginLeft: 8,
  },
  statusUpdatesList: {
    marginTop: 8,
  },
  statusUpdateItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statusUpdateIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  statusUpdateTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  statusUpdateDate: {
    fontSize: 12,
    color: '#757575',
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

export default JobDetailScreen;
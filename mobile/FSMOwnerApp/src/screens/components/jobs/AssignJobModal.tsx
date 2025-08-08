import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  FlatList
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
const api = axios.create({
  baseURL: 'http://your-api-base-url', // Replace with your actual API URL
});
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

interface Worker {
  id: string;
  name: string;
  email?: string;
  role: string;
}

interface AssignJobModalProps {
  visible: boolean;
  job: any;
  onClose: () => void;
  onJobAssigned: (updatedJob: any) => void;
}

export const AssignJobModal: React.FC<AssignJobModalProps> = ({
  visible,
  job,
  onClose,
  onJobAssigned
}) => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingWorkers, setFetchingWorkers] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchWorkers();
    if (job && job.assigned_user_id) {
      setSelectedWorkerId(job.assigned_user_id);
    }
  }, [job]);

  const fetchWorkers = async () => {
    try {
      setFetchingWorkers(true);
      const response = await api.get('/users');
      const workersList = response.data.filter((user: any) => user.role === 'worker');
      setWorkers(workersList);
    } catch (err) {
      setError('Failed to load workers');
      console.error('Error loading workers:', err);
    } finally {
      setFetchingWorkers(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await api.post(`/jobs/${job.id}/assign`, {
        userId: selectedWorkerId || null  // Allow unassignment
      });
      
      setSuccess(true);
      onJobAssigned(response.data);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign job');
      console.error('Error assigning job:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderWorkerItem = ({ item }: { item: Worker }) => {
    const isSelected = selectedWorkerId === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.workerItem,
          isSelected && styles.workerItemSelected
        ]}
        onPress={() => setSelectedWorkerId(item.id)}
      >
        <View style={styles.workerInfo}>
          <MaterialIcons
            name="person"
            size={24}
            color={isSelected ? "#1976d2" : "#757575"}
            style={styles.workerIcon}
          />
          <Text style={[
            styles.workerName,
            isSelected && styles.workerNameSelected
          ]}>
            {item.name}
          </Text>
        </View>
        {isSelected && (
          <MaterialIcons name="check-circle" size={24} color="#1976d2" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Assign Job</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#757575" />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={20} color="#c62828" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={styles.successContainer}>
              <MaterialIcons name="check-circle" size={20} color="#2e7d32" />
              <Text style={styles.successText}>Job assigned successfully!</Text>
            </View>
          ) : null}

          <View style={styles.jobInfoContainer}>
            <Text style={styles.sectionTitle}>Job Details</Text>
            <View style={styles.jobInfo}>
              <Text style={styles.jobTitle}>{job?.title}</Text>
              <Text style={styles.jobDetail}>
                Customer: {job?.customer_name || 'Not specified'}
              </Text>
              <Text style={styles.jobDetail}>
                Priority: <Text style={styles.jobPriority}>{job?.priority || 'Not specified'}</Text>
              </Text>
            </View>
          </View>

          <View style={styles.workersSection}>
            <Text style={styles.sectionTitle}>Assign To Worker</Text>
            
            <TouchableOpacity
              style={[
                styles.workerItem,
                selectedWorkerId === '' && styles.workerItemSelected
              ]}
              onPress={() => setSelectedWorkerId('')}
            >
              <View style={styles.workerInfo}>
                <MaterialIcons
                  name="person-off"
                  size={24}
                  color={selectedWorkerId === '' ? "#1976d2" : "#757575"}
                  style={styles.workerIcon}
                />
                <Text style={[
                  styles.workerName,
                  selectedWorkerId === '' && styles.workerNameSelected
                ]}>
                  Unassigned
                </Text>
              </View>
              {selectedWorkerId === '' && (
                <MaterialIcons name="check-circle" size={24} color="#1976d2" />
              )}
            </TouchableOpacity>

            {fetchingWorkers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#1976d2" />
                <Text style={styles.loadingText}>Loading workers...</Text>
              </View>
            ) : workers.length === 0 ? (
              <Text style={styles.noWorkersText}>No workers available</Text>
            ) : (
              <FlatList
                data={workers}
                renderItem={renderWorkerItem}
                keyExtractor={(item) => item.id}
                style={styles.workersList}
              />
            )}

            {selectedWorkerId === '' && (
              <Text style={styles.unassignWarning}>
                Selecting "Unassigned" will remove any current assignment
              </Text>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Assign Job</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    margin: 16,
    marginTop: 0,
    borderRadius: 4,
  },
  errorText: {
    color: '#c62828',
    marginLeft: 8,
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 12,
    margin: 16,
    marginTop: 0,
    borderRadius: 4,
  },
  successText: {
    color: '#2e7d32',
    marginLeft: 8,
    flex: 1,
  },
  jobInfoContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  jobInfo: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 4,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  jobDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  jobPriority: {
    textTransform: 'capitalize',
  },
  workersSection: {
    padding: 16,
    paddingTop: 0,
  },
  workersList: {
    maxHeight: 250,
  },
  workerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  workerItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workerIcon: {
    marginRight: 12,
  },
  workerName: {
    fontSize: 15,
    color: '#333',
  },
  workerNameSelected: {
    color: '#1976d2',
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  noWorkersText: {
    padding: 16,
    color: '#666',
    textAlign: 'center',
  },
  unassignWarning: {
    fontSize: 13,
    color: '#f57c00',
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    paddingTop: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
    minWidth: 100,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AssignJobModal;
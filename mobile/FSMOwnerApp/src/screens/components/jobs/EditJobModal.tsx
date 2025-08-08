import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
const api = axios.create({
  baseURL: 'https://localhost:3000', // Replace with your actual API URL
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
  role: string;
}

interface EditJobModalProps {
  visible: boolean;
  job: any;
  onClose: () => void;
  onJobUpdated: (updatedJob: any) => void;
}

export const EditJobModal: React.FC<EditJobModalProps> = ({
  visible,
  job,
  onClose,
  onJobUpdated
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: '',
    scheduledStart: new Date(),
    scheduledEnd: new Date(),
    priority: '',
    location: '',
    assignedUserId: ''
  });
  
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || '',
        description: job.description || '',
        status: job.status || '',
        scheduledStart: job.scheduled_start ? new Date(job.scheduled_start) : new Date(),
        scheduledEnd: job.scheduled_end ? new Date(job.scheduled_end) : new Date(),
        priority: job.priority || '',
        location: job.location || '',
        assignedUserId: job.assigned_user_id || ''
      });
    }
    
    fetchWorkers();
  }, [job]);

  const fetchWorkers = async () => {
    try {
      const response = await api.get('/users');
      const workersList = response.data.filter((user: any) => user.role === 'worker');
      setWorkers(workersList);
    } catch (err) {
      console.error('Error loading workers:', err);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        scheduledStart: formData.scheduledStart.toISOString(),
        scheduledEnd: formData.scheduledEnd.toISOString(),
        assignedUserId: formData.assignedUserId || null
      };
  
      const response = await api.put(`/jobs/${job.id}`, submitData);
      onJobUpdated(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update job');
      console.error('Error updating job:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        scheduledStart: selectedDate
      }));
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        scheduledEnd: selectedDate
      }));
    }
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statuses = [
    { value: 'draft', label: 'Draft' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Job</Text>
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

            <ScrollView style={styles.formContainer}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Title</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.title}
                  onChangeText={(value) => handleTextChange('title', value)}
                  placeholder="Job title"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Status</Text>
                <View style={styles.pickerContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.optionsRow}>
                      {statuses.map(status => (
                        <TouchableOpacity
                          key={status.value}
                          style={[
                            styles.optionButton,
                            formData.status === status.value && styles.optionButtonSelected
                          ]}
                          onPress={() => handleTextChange('status', status.value)}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              formData.status === status.value && styles.optionTextSelected
                            ]}
                          >
                            {status.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={formData.description}
                  onChangeText={(value) => handleTextChange('description', value)}
                  placeholder="Job description and requirements"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Start Date & Time</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowStartPicker(true)}
                >
                  <MaterialIcons name="event" size={20} color="#666" style={styles.dateIcon} />
                  <Text style={styles.dateText}>{formatDisplayDate(formData.scheduledStart)}</Text>
                </TouchableOpacity>
                {showStartPicker && (
                <DateTimePicker
                    value={formData.scheduledStart}
                    mode="datetime"
                    onChange={handleStartDateChange}
                    {...(Platform.OS === 'android' ? { display: 'default' } : {})}
                />
                )}
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>End Date & Time</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowEndPicker(true)}
                >
                  <MaterialIcons name="event" size={20} color="#666" style={styles.dateIcon} />
                  <Text style={styles.dateText}>{formatDisplayDate(formData.scheduledEnd)}</Text>
                </TouchableOpacity>
                {showEndPicker && (
            <DateTimePicker
                value={formData.scheduledEnd}
                mode="datetime"
                onChange={handleEndDateChange}
                {...(Platform.OS === 'android' ? { display: 'default' } : {})}
            />
            )}
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Priority</Text>
                <View style={styles.pickerContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.optionsRow}>
                      {priorities.map(priority => (
                        <TouchableOpacity
                          key={priority.value}
                          style={[
                            styles.optionButton,
                            formData.priority === priority.value && styles.optionButtonSelected
                          ]}
                          onPress={() => handleTextChange('priority', priority.value)}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              formData.priority === priority.value && styles.optionTextSelected
                            ]}
                          >
                            {priority.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Assign Worker</Text>
                <View style={styles.pickerContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.optionsRow}>
                      <TouchableOpacity
                        style={[
                          styles.optionButton,
                          formData.assignedUserId === '' && styles.optionButtonSelected
                        ]}
                        onPress={() => handleTextChange('assignedUserId', '')}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            formData.assignedUserId === '' && styles.optionTextSelected
                          ]}
                        >
                          Unassigned
                        </Text>
                      </TouchableOpacity>
                      
                      {workers.map(worker => (
                        <TouchableOpacity
                          key={worker.id}
                          style={[
                            styles.optionButton,
                            formData.assignedUserId === worker.id && styles.optionButtonSelected
                          ]}
                          onPress={() => handleTextChange('assignedUserId', worker.id)}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              formData.assignedUserId === worker.id && styles.optionTextSelected
                            ]}
                          >
                            {worker.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Location</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.location}
                  onChangeText={(value) => handleTextChange('location', value)}
                  placeholder="Job location"
                />
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
                    <Text style={styles.submitButtonText}>Update Job</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: '90%',
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
    marginBottom: 0,
    borderRadius: 4,
  },
  errorText: {
    color: '#c62828',
    marginLeft: 8,
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#f9f9f9',
  },
  optionsRow: {
    flexDirection: 'row',
    padding: 4,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: '#eeeeee',
  },
  optionButtonSelected: {
    backgroundColor: '#e3f2fd',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
  },
  optionTextSelected: {
    color: '#1976d2',
    fontWeight: '500',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  dateIcon: {
    marginRight: 10,
  },
  dateText: {
    fontSize: 15,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
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
    minWidth: 120,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default EditJobModal;
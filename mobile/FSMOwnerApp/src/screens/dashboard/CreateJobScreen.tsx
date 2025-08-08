import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, ParamListBase, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { JobsStackParamList } from '../../navigation/JobsStackNavigator';
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

interface Customer {
  id: string;
  name: string;
  company_name?: string;
}

interface Worker {
  id: string;
  name: string;
  role: string;
}

const CreateJobScreen = () => {
const navigation = useNavigation<StackNavigationProp<JobsStackParamList>>();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    customerId: '',
    scheduledStart: new Date(),
    scheduledEnd: new Date(new Date().getTime() + 2 * 60 * 60 * 1000), // Default to +2 hours
    priority: 'medium',
    location: '',
    assignedUserId: ''
  });
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [customersRes, workersRes] = await Promise.all([
        api.get('/customers'),
        api.get('/users')
      ]);
      setCustomers(customersRes.data);
      setWorkers(workersRes.data.filter((user: any) => user.role === 'worker'));
    } catch (err) {
      setError('Failed to load form data');
      console.error('Error loading form data:', err);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.customerId) {
      Alert.alert('Required Fields', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');
  
    try {
      const submitData = {
        ...formData,
        scheduledStart: formData.scheduledStart.toISOString(),
        scheduledEnd: formData.scheduledEnd.toISOString(),
        assignedUserId: formData.assignedUserId || null
      };
  
      const response = await api.post('/jobs', submitData);
      navigation.navigate('JobsList', {
        refresh: true,
        success: true,
        message: 'Job created successfully'
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create job');
      console.error('Error creating job:', err);
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

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Job</Text>
        <View style={{ width: 24 }} /> {/* Empty view for balanced header */}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.content}>
          {error ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={20} color="#c62828" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.formContainer}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Title<Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={styles.textInput}
                value={formData.title}
                onChangeText={(value) => handleTextChange('title', value)}
                placeholder="Job title"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Customer<Text style={styles.requiredStar}>*</Text></Text>
              <View style={styles.pickerContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.optionsRow}>
                    {customers.map(customer => (
                      <TouchableOpacity
                        key={customer.id}
                        style={[
                          styles.optionButton,
                          formData.customerId === customer.id && styles.optionButtonSelected
                        ]}
                        onPress={() => handleTextChange('customerId', customer.id)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            formData.customerId === customer.id && styles.optionTextSelected
                          ]}
                        >
                          {customer.name}
                          {customer.company_name ? ` (${customer.company_name})` : ''}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              {customers.length === 0 && (
                <TouchableOpacity 
                  style={styles.addNewButton}
                  onPress={() => Alert.alert('Coming Soon', 'Customer creation feature coming soon')}
                >
                  <MaterialIcons name="add" size={16} color="#1976d2" />
                  <Text style={styles.addNewButtonText}>Add New Customer</Text>
                </TouchableOpacity>
              )}
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
              <Text style={styles.fieldLabel}>Location</Text>
              <TextInput
                style={styles.textInput}
                value={formData.location}
                onChangeText={(value) => handleTextChange('location', value)}
                placeholder="Job location"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Start Date & Time<Text style={styles.requiredStar}>*</Text></Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowStartPicker(true)}
              >
                <MaterialIcons name="event" size={20} color="#666" style={styles.dateIcon} />
                <Text style={styles.dateText}>{formatDisplayDate(formData.scheduledStart)}</Text>
              </TouchableOpacity>
            {showStartPicker && (
                <DateTimePicker
                value={formData.scheduledEnd}
                mode="datetime"
                onChange={handleEndDateChange}
                {...(Platform.OS === 'android' ? { display: 'default' } : {})}
                />
            )}
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>End Date & Time<Text style={styles.requiredStar}>*</Text></Text>
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

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
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
                  <Text style={styles.submitButtonText}>Create Job</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  content: {
    flex: 1,
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
  requiredStar: {
    color: '#c62828',
    fontSize: 14,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#fff',
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
    backgroundColor: '#fff',
  },
  dateIcon: {
    marginRight: 10,
  },
  dateText: {
    fontSize: 15,
    color: '#333',
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  addNewButtonText: {
    fontSize: 14,
    color: '#1976d2',
    marginLeft: 4,
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

export default CreateJobScreen;
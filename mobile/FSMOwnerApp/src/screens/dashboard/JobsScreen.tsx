import React, { useState, useEffect } from 'react';
import { useNavigation, CommonActions, ParamListBase, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { JobsStackParamList } from '../../navigation/JobsStackNavigator';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
interface Job {
  id: string;
  title: string;
  status: 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  customer_name: string;
  scheduled_start: string;
  location?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_hours?: number;
}
const DEV_IP = '192.168.0.97'; // Replace with your computer's IP address
const DEV_PORT = '3000';
const API_URL = __DEV__ 
  ? `http://${DEV_IP}:${DEV_PORT}/api/v1` // Local development
  : 'https://your-production-server.com/api/v1'; // Future production URL

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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

const JobsScreen = () => {
    const navigation = useNavigation<StackNavigationProp<JobsStackParamList>>();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      console.log('Auth token exists:', !!token);
      
      console.log('Starting jobs fetch...');
      const response = await axios.get(`http://192.168.0.97:3000/api/v1/jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Jobs API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });

      setJobs(response.data);
      setError(null);
    } catch (err) {
      console.error('Error details:', err);
      
      let errorMessage = 'Failed to fetch jobs';
      if (err.response?.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        );
      } else if (err.response?.status === 404) {
        errorMessage = 'Jobs endpoint not found. Please check API configuration.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
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
type PriorityIcon = { name: string; color: string };

const getPriorityIcon = (priority: string) => {
  const icons: Record<PriorityType, PriorityIcon> = {
    low: { name: 'flag-outline', color: '#757575' },
    medium: { name: 'flag-outline', color: '#1976D2' },
    high: { name: 'flag-outline', color: '#F57C00' },
    urgent: { name: 'flag', color: '#D32F2F' }
  };
  return icons[priority as PriorityType] || icons.low;
};
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true;
    return job.status === filter;
  });

  const renderJobItem = ({ item }: { item: Job }) => {
    const priorityIcon = getPriorityIcon(item.priority);
    
    return (
        <TouchableOpacity
        style={styles.jobCard}
        onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
      >
        <View style={styles.jobHeader}>
          <Text style={styles.jobTitle} numberOfLines={1}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={[styles.statusText, { color: getStatusTextColor(item.status) }]}>
              {item.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        <View style={styles.jobInfo}>
          <View style={styles.infoRow}>
            <MaterialIcons name="person" size={16} color="#666" style={styles.infoIcon} />
            <Text style={styles.infoText}>{item.customer_name || 'No customer assigned'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="event" size={16} color="#666" style={styles.infoIcon} />
            <Text style={styles.infoText}>{formatDate(item.scheduled_start)}</Text>
          </View>

          {item.location && (
            <View style={styles.infoRow}>
              <MaterialIcons name="location-on" size={16} color="#666" style={styles.infoIcon} />
              <Text style={styles.infoText} numberOfLines={1}>{item.location}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
          <MaterialCommunityIcons
  name={priorityIcon.name}
  size={16}
  color={priorityIcon.color}
  style={styles.infoIcon}
/>
            <Text style={[styles.infoText, { color: priorityIcon.color }]}>
              {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} Priority
            </Text>
          </View>
        </View>

        <View style={styles.jobFooter}>
          <View style={styles.timeEstimate}>
            <MaterialIcons name="schedule" size={14} color="#666" />
            <Text style={styles.timeEstimateText}>
              {item.estimated_hours ? `${item.estimated_hours} hours` : 'No estimate'}
            </Text>
          </View>
          <View style={styles.viewDetails}>
            <Text style={styles.viewDetailsText}>View Details</Text>
            <MaterialIcons name="chevron-right" size={16} color="#1976d2" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterButtons = () => {
    const filters = ['all', 'draft', 'scheduled', 'in_progress', 'completed', 'cancelled'];
    
    return (
      <View style={styles.filtersOuterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filtersContainer}
        >
          {filters.map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filter === status && styles.filterButtonActive
              ]}
              onPress={() => setFilter(status)}
            >
              <Text 
                style={[
                  styles.filterText,
                  filter === status && styles.filterTextActive
                ]}
                numberOfLines={1}
              >
                {status === 'all' ? 'All Jobs' : status.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Loading jobs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorHint}>
          Please check:
        </Text>
        <View style={styles.errorHintList}>
          <Text style={styles.errorHintItem}>• Your API server is running</Text>
          <Text style={styles.errorHintItem}>• You are logged in with valid credentials</Text>
          <Text style={styles.errorHintItem}>• Your authentication token is valid</Text>
        </View>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            setError(null);
            fetchJobs();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with add button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Jobs</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateJob')}
        >
          <MaterialIcons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {renderFilterButtons()}

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="file-document-outline" size={56} color="#ccc" />
          <Text style={styles.emptyText}>No jobs found for the selected filter.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          renderItem={renderJobItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#1976d2',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  filtersOuterContainer: {
    height: 60, // Fixed height for the filter area
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center', // Center items vertically
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    height: 36, // Fixed height for all buttons
    justifyContent: 'center', // Center text vertically
  },
  filterButtonActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976d2',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  filterTextActive: {
    color: '#1976d2',
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  jobInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  timeEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeEstimateText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  viewDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 13,
    color: '#1976d2',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff8f8',
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  errorText: {
    fontSize: 16,
    color: '#c62828',
    marginBottom: 16,
  },
  errorHint: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  errorHintList: {
    marginBottom: 16,
  },
  errorHintItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  retryButton: {
    backgroundColor: '#ffebee',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#c62828',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default JobsScreen;
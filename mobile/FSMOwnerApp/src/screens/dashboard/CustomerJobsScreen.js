import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import client from '../../api/client';

const CustomerJobsScreen = ({ route, navigation }) => {
  const { customerId, customerName } = route.params;
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    navigation.setOptions({
      title: `${customerName}'s Jobs`,
      headerShown: true,
      headerLeft: () => (
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#1976d2" />
        </TouchableOpacity>
      )
    });
    
    fetchJobs();
  }, [navigation, customerName]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await client.get(`/customers/${customerId}/jobs`);
      setJobs(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusDetails = (status) => {
    switch (status) {
      case 'scheduled':
        return { icon: 'event', color: '#EAB308', bgColor: '#FEF9C3' };
      case 'in_progress':
        return { icon: 'pending', color: '#3B82F6', bgColor: '#DBEAFE' };
      case 'completed':
        return { icon: 'check-circle', color: '#10B981', bgColor: '#D1FAE5' };
      case 'cancelled':
        return { icon: 'cancel', color: '#EF4444', bgColor: '#FEE2E2' };
      default:
        return { icon: 'help', color: '#6B7280', bgColor: '#F3F4F6' };
    }
  };

  const getPriorityDetails = (priority) => {
    switch (priority) {
      case 'high':
        return { color: '#DC2626', bgColor: '#FEE2E2' };
      case 'urgent':
        return { color: '#7F1D1D', bgColor: '#FECACA' };
      case 'medium':
        return { color: '#D97706', bgColor: '#FEF3C7' };
      case 'low':
        return { color: '#059669', bgColor: '#D1FAE5' };
      default:
        return { color: '#6B7280', bgColor: '#F3F4F6' };
    }
  };

  const renderJobItem = ({ item }) => {
    const statusDetails = getStatusDetails(item.status);
    const priorityDetails = getPriorityDetails(item.priority);
    
    const scheduleDate = new Date(item.scheduled_start);
    
    return (
      <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Add a back button at the top as a fallback */}
        <TouchableOpacity 
          style={styles.backButtonTop}
          onPress={() => navigation.goBack()}
        >
          <View style={styles.backButtonContainer}>
            <MaterialIcons name="arrow-back" size={24} color="#1976d2" />
            <Text style={styles.backButtonText}>Back to Customers</Text>
          </View>
        </TouchableOpacity>
        
      <TouchableOpacity 
        style={styles.jobCard}
        onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
      >
        <View style={styles.jobHeader}>
          <Text style={styles.jobTitle}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusDetails.bgColor }]}>
            <MaterialIcons name={statusDetails.icon} size={12} color={statusDetails.color} />
            <Text style={[styles.statusText, { color: statusDetails.color }]}>
              {item.status.replace('_', ' ')}
            </Text>
          </View>
        </View>
        
        {item.description && (
          <Text style={styles.jobDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <View style={styles.jobDetailsContainer}>
          <View style={styles.jobDetailRow}>
            <MaterialIcons name="event" size={14} color="#6B7280" />
            <Text style={styles.jobDetailText}>
              {scheduleDate.toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.jobDetailRow}>
            <MaterialIcons name="schedule" size={14} color="#6B7280" />
            <Text style={styles.jobDetailText}>
              {scheduleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          
          <View style={styles.jobDetailRow}>
            <MaterialIcons name="flag" size={14} color={priorityDetails.color} />
            <Text style={[styles.jobDetailText, { color: priorityDetails.color }]}>
              {item.priority} priority
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      </View>
      </SafeAreaView>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading jobs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchJobs}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={jobs}
        renderItem={renderJobItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="work-off" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No jobs found for this customer</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#4F46E5',
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
  },
  jobCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  jobDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  jobDetailsContainer: {
    marginTop: 8,
  },
  jobDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  jobDetailText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default CustomerJobsScreen;
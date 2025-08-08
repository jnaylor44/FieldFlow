import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { Play, CheckCircle, AlertCircle } from 'lucide-react-native';
import client from '../../api/client';

const JobActions = ({ job, onStatusChange }) => {
  const [loading, setLoading] = useState(false);
  const handleStartJob = async () => {
    try {
      setLoading(true);
      console.log(`Starting job ${job.id}`);
      
      const response = await client.post(`/jobs/${job.id}/start`);
      
      console.log('Job started successfully:', response.data);
      Alert.alert('Success', 'Job started successfully');
      if (onStatusChange) {
        onStatusChange(response.data);
      }
    } catch (error) {
      console.error('Error starting job:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to start job. Please try again.';
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };
  const handleCompleteJob = async () => {
    try {
      setLoading(true);
      console.log(`Completing job ${job.id}`);
      
      const response = await client.post(`/jobs/${job.id}/complete`);
      
      console.log('Job completed successfully:', response.data);
      Alert.alert('Success', 'Job completed successfully');
      if (onStatusChange) {
        onStatusChange(response.data);
      }
    } catch (error) {
      console.error('Error completing job:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to complete job. Please try again.';
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };
  const confirmAction = (action, message) => {
    Alert.alert(
      'Confirm Action',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: action }
      ]
    );
  };
  const renderActions = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#4F46E5" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      );
    }

    switch (job.status) {
      case 'scheduled':
        return (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => confirmAction(handleStartJob, 'Are you sure you want to start this job?')}
          >
            <Play size={20} color="white" />
            <Text style={styles.actionButtonText}>Start Job</Text>
          </TouchableOpacity>
        );
        
      case 'in_progress':
        return (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#10B981' }]}
            onPress={() => confirmAction(handleCompleteJob, 'Are you sure you want to mark this job as complete?')}
          >
            <CheckCircle size={20} color="white" />
            <Text style={styles.actionButtonText}>Complete Job</Text>
          </TouchableOpacity>
        );
        
      case 'completed':
        return (
          <View style={styles.completedContainer}>
            <CheckCircle size={20} color="#10B981" />
            <Text style={styles.completedText}>Job Completed</Text>
          </View>
        );
        
      case 'cancelled':
        return (
          <View style={styles.cancelledContainer}>
            <AlertCircle size={20} color="#EF4444" />
            <Text style={styles.cancelledText}>Job Cancelled</Text>
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderActions()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  loadingText: {
    marginLeft: 8,
    color: '#6B7280',
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  completedText: {
    color: '#10B981',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  cancelledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelledText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default JobActions;
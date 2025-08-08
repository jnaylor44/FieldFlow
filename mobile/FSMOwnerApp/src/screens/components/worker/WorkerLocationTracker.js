import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../../../api/client';
import * as Location from 'expo-location';

const WorkerLocationTracker = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const lastUpdateTime = await AsyncStorage.getItem('lastLocationUpdate');
        if (lastUpdateTime) {
          setLastUpdate(new Date(lastUpdateTime));
        }
        const trackingEnabled = await AsyncStorage.getItem('locationTrackingEnabled');
        setIsTracking(trackingEnabled === 'true');
        checkPermissions();
      } catch (err) {
        console.error('Error in initial setup:', err);
      }
    })();
  }, []);
  
  const checkPermissions = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status);
      
      if (status !== 'granted') {
        setErrorMsg('Location permission is not granted');
      }
    } catch (err) {
      console.error('Error checking permissions:', err);
      setErrorMsg(`Permission check error: ${err.message}`);
    }
  };
  const requestPermissions = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error requesting permissions:', err);
      setErrorMsg(`Permission request error: ${err.message}`);
      return false;
    }
  };
  const toggleTracking = async () => {
    try {
      const newState = !isTracking;
      
      if (newState) {
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
          return;
        }
        await sendLocationUpdate();
      }
      
      setIsTracking(newState);
      await AsyncStorage.setItem('locationTrackingEnabled', newState ? 'true' : 'false');
    } catch (err) {
      console.error('Error toggling tracking:', err);
      setErrorMsg(`Failed to toggle tracking: ${err.message}`);
      Alert.alert('Error', `Failed to toggle tracking: ${err.message}`);
    }
  };
  const sendLocationUpdate = async () => {
    try {
      if (permissionStatus !== 'granted') {
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
          return;
        }
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      await client.post('/location/update', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        batteryLevel: 100 // Hardcoded for now
      });
      const now = new Date().toISOString();
      await AsyncStorage.setItem('lastLocationUpdate', now);
      setLastUpdate(new Date(now));
      setErrorMsg(null);
      
      console.log('Location updated successfully');
    } catch (err) {
      console.error('Error sending location update:', err);
      setErrorMsg(`Failed to update location: ${err.message}`);
      Alert.alert('Error', `Failed to update location: ${err.message}`);
    }
  };
  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Never updated';
    
    const now = new Date();
    const diffMs = now - lastUpdate;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return lastUpdate.toLocaleDateString();
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Location Sharing</Text>
        </View>
        
        <View style={styles.contentContainer}>
          <Text style={styles.descriptionText}>
            Share your location with your company to help them track job progress and provide assistance when needed.
          </Text>
          
          {errorMsg ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}
          
          <View style={styles.toggleContainer}>
            <Text style={[styles.toggleText, isTracking ? styles.toggleTextEnabled : styles.toggleTextDisabled]}>
              {isTracking ? 'Enabled' : 'Disabled'}
            </Text>
            <Switch
              value={isTracking}
              onValueChange={toggleTracking}
              trackColor={{ false: '#D1D5DB', true: '#818CF8' }}
              thumbColor={isTracking ? '#4F46E5' : '#F3F4F6'}
              ios_backgroundColor="#D1D5DB"
            />
          </View>
          
          {lastUpdate && (
            <Text style={styles.lastUpdateText}>
              Last updated: {formatLastUpdate()}
            </Text>
          )}
          
          {isTracking && (
            <TouchableOpacity 
              style={styles.updateButton}
              onPress={sendLocationUpdate}
            >
              <Text style={styles.updateButtonText}>Update Now</Text>
            </TouchableOpacity>
          )}
          
          {permissionStatus !== 'granted' && (
            <TouchableOpacity 
              style={styles.permissionButton}
              onPress={requestPermissions}
            >
              <Text style={styles.permissionButtonText}>Grant Location Permission</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  headerContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  contentContainer: {
    padding: 16,
  },
  descriptionText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 16,
    lineHeight: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '500',
  },
  toggleTextEnabled: {
    color: '#4F46E5',
  },
  toggleTextDisabled: {
    color: '#6B7280',
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
  },
  updateButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  permissionButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 16,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
  }
});

export default WorkerLocationTracker;
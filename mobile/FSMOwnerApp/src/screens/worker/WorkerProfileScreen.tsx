import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert, 
  RefreshControl,
  Image
} from 'react-native';
import { 
  User, 
  Mail, 
  Phone, 
  LogOut, 
  Settings, 
  Bell, 
  HelpCircle, 
  Shield, 
  Briefcase,
  ChevronRight
} from 'lucide-react-native';
import auth from '../../api/auth';
import client from '../../api/client';
import { useNavigation } from '@react-navigation/native';
import { resetToLogin } from '../../navigation'; // Import the navigation helper

const WorkerProfileScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    completedJobs: 0,
    hoursThisWeek: 0,
    hoursThisMonth: 0
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const currentUser = await auth.getCurrentUser();
      setUserData(currentUser);
      const statsResponse = await client.get('/worker/stats');
      setStats({
        completedJobs: statsResponse.data.completedJobs || 0,
        hoursThisWeek: statsResponse.data.hoursThisWeek || 0,
        hoursThisMonth: statsResponse.data.hoursThisMonth || 0
      });
      
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserData();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('user');
              await AsyncStorage.removeItem('user_info');
              const { DevSettings } = require('react-native');
              if (__DEV__ && DevSettings.reload) {
                DevSettings.reload();
              } else {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }
            } catch (error) {
              console.error('Error during logout:', error);
            }
          } 
        },
      ]
    );
  };

  if (loading && !userData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {userData?.avatar_url ? (
            <Image 
              source={{ uri: userData.avatar_url }} 
              style={styles.avatar} 
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <User size={40} color="#6B7280" />
            </View>
          )}
        </View>
        
        <Text style={styles.userName}>{userData?.name || 'Worker'}</Text>
        <Text style={styles.userRole}>Worker</Text>
      </View>
      
      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.completedJobs}</Text>
          <Text style={styles.statLabel}>Jobs Completed</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.hoursThisWeek}</Text>
          <Text style={styles.statLabel}>Hours This Week</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.hoursThisMonth}</Text>
          <Text style={styles.statLabel}>Hours This Month</Text>
        </View>
      </View>
      
      {/* Rest of your component remains the same */}
      {/* Contact Info */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        
        <View style={styles.infoItem}>
          <Mail size={20} color="#6B7280" />
          <Text style={styles.infoText}>{userData?.email || 'No email available'}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Phone size={20} color="#6B7280" />
          <Text style={styles.infoText}>{userData?.phone || 'No phone available'}</Text>
        </View>
      </View>
      
      {/* Settings Menu */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <Bell size={20} color="#6B7280" />
          <Text style={styles.menuItemText}>Notifications</Text>
          <ChevronRight size={16} color="#9CA3AF" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Shield size={20} color="#6B7280" />
          <Text style={styles.menuItemText}>Privacy & Security</Text>
          <ChevronRight size={16} color="#9CA3AF" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <HelpCircle size={20} color="#6B7280" />
          <Text style={styles.menuItemText}>Help & Support</Text>
          <ChevronRight size={16} color="#9CA3AF" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Settings size={20} color="#6B7280" />
          <Text style={styles.menuItemText}>App Settings</Text>
          <ChevronRight size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
      
      {/* Logout Button */}
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <LogOut size={20} color="#EF4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
      
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: 'white',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginTop: 1,
    paddingVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4F46E5',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  sectionContainer: {
    backgroundColor: 'white',
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginTop: 16,
    paddingVertical: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: 'center',
    padding: 16,
  },
  versionText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default WorkerProfileScreen;
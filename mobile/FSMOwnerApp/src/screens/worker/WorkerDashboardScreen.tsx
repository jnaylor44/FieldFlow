import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { Briefcase, Clock, CheckCircle, MapPin } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import client from '../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WorkerLocationTracker from '../components/worker/WorkerLocationTracker';

const WorkerDashboardScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todaysJobs, setTodaysJobs] = useState([]);
  const [userStats, setUserStats] = useState({
    activeJobs: 0,
    upcomingJobs: 0,
    completedToday: 0
  });
  const [userData, setUserData] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchDashboardData();
    }
  }, [userId]);
  
  const getCurrentUser = async () => {
    try {
      const userInfo = await AsyncStorage.getItem('user_info');
      const userObj = userInfo ? JSON.parse(userInfo) : null;
      setUserData(userObj);
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setUserId(user.id);
        console.log("User ID from storage:", user.id);
      } else {
        try {
          const userResponse = await client.get('/users/me');
          setUserId(userResponse.data.id);
          setUserData(userResponse.data);
          console.log("User ID from API:", userResponse.data.id);
        } catch (error) {
          console.error('Error fetching current user:', error);
        }
      }
    } catch (error) {
      console.error('Error getting user data:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      if (!userId) {
        console.error('No user ID available');
        setLoading(false);
        return;
      }
      const today = new Date().toISOString().split('T')[0];
      
      console.log(`Fetching jobs data for worker ${userId}`);
      const [activeJobs, upcomingJobs] = await Promise.all([
        client.get(`/workers/${userId}/jobs`, { 
          params: { status: 'in_progress' } 
        }),
        client.get(`/workers/${userId}/jobs`, { 
          params: { status: 'scheduled' } 
        })
      ]);
      const completedJobsResponse = await client.get(`/workers/${userId}/jobs`, { 
        params: { status: 'completed' } 
      });
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const completedToday = completedJobsResponse.data.filter(job => {
        const completionDate = job.actual_end 
          ? new Date(job.actual_end) 
          : new Date(job.updated_at);
        
        return completionDate >= todayStart;
      });
      const todaysJobsData = await client.get(`/workers/${userId}/jobs`, { 
        params: { timeframe: 'today' }
      });
      
      console.log(`Fetched jobs counts: Active=${activeJobs.data.length}, Upcoming=${upcomingJobs.data.length}, Completed Today=${completedToday.length}`);
      
      setUserStats({
        activeJobs: activeJobs.data.length,
        upcomingJobs: upcomingJobs.data.length,
        completedToday: completedToday.length
      });
      const relevantJobs = todaysJobsData.data.filter(job => 
        job.status === 'scheduled' || job.status === 'in_progress'
      );
      
      setTodaysJobs(relevantJobs.slice(0, 5)); // Limit to 5 jobs
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const navigateToJobDetail = (jobId) => {
    navigation.navigate('WorkerJobDetail', { jobId });
  };

  const navigateToAllJobs = () => {
    navigation.navigate('WorkerJobs');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* App Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
      </View>
      
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Hello, {userData?.name || 'Worker'}
          </Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric'
            })}
          </Text>
        </View>
        
        {/* Location Tracker */}
        <View style={styles.trackerCard}>
          <WorkerLocationTracker />
        </View>
        
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard 
            title="Active Jobs" 
            value={userStats.activeJobs} 
            icon={<Briefcase color="#4F46E5" size={24} />} 
            backgroundColor="#EEF2FF" 
          />
          <StatCard 
            title="Upcoming" 
            value={userStats.upcomingJobs} 
            icon={<Clock color="#8B5CF6" size={24} />} 
            backgroundColor="#F5F3FF" 
          />
          <StatCard 
            title="Completed" 
            value={userStats.completedToday} 
            icon={<CheckCircle color="#10B981" size={24} />} 
            backgroundColor="#ECFDF5" 
          />
        </View>
        
        {/* Today's Jobs */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Jobs</Text>
            <TouchableOpacity onPress={navigateToAllJobs}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <ActivityIndicator size="large" color="#4F46E5" style={styles.loader} />
          ) : todaysJobs.length > 0 ? (
            <View>
              {todaysJobs.map(job => (
                <TouchableOpacity 
                  key={job.id}
                  style={styles.jobCard}
                  onPress={() => navigateToJobDetail(job.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.jobCardHeader}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <View style={[
                      styles.jobStatus,
                      job.status === 'in_progress' 
                        ? styles.jobStatusInProgress 
                        : styles.jobStatusScheduled
                    ]}>
                      <Text style={styles.jobStatusText}>
                        {job.status === 'in_progress' ? 'In Progress' : 'Scheduled'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.jobTimeContainer}>
                    <Clock size={14} color="#6B7280" />
                    <Text style={styles.jobTimeText}>
                      {new Date(job.scheduled_start).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                      {' - '}
                      {new Date(job.scheduled_end).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                  
                  {job.location && (
                    <View style={styles.jobLocation}>
                      <MapPin size={14} color="#6B7280" />
                      <Text style={styles.jobLocationText} numberOfLines={1}>
                        {job.location}
                      </Text>
                    </View>
                  )}
                  
                  {job.customer_name && (
                    <Text style={styles.customerName}>
                      {job.customer_name}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No jobs scheduled for today</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
const StatCard = ({ title, value, icon, backgroundColor }) => {
  return (
    <View style={[styles.statCard, { backgroundColor }]}>
      <View style={styles.statIconContainer}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    paddingBottom: 24,
  },
  welcomeSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  trackerCard: {
    margin: 16,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    width: '31%',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  jobCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  jobCardHeader: {
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
  jobStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  jobStatusScheduled: {
    backgroundColor: '#E0E7FF',
  },
  jobStatusInProgress: {
    backgroundColor: '#DBEAFE',
  },
  jobStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4F46E5',
  },
  jobTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  jobTimeText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  jobLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  jobLocationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  loader: {
    marginTop: 16,
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default WorkerDashboardScreen;
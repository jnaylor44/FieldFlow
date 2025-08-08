 import React, { useState, useEffect } from 'react';
 import { 
   View, 
   Text, 
   StyleSheet, 
   FlatList, 
   TouchableOpacity, 
   ActivityIndicator,
   RefreshControl,
   SafeAreaView,
   StatusBar,
   Platform
 } from 'react-native';
 import { Briefcase, Calendar, CheckCircle, MapPin, Clock } from 'lucide-react-native';
 import { useNavigation } from '@react-navigation/native';
 import AsyncStorage from '@react-native-async-storage/async-storage';
 import client from '../../api/client';
 
 const JOB_STATUS = {
   scheduled: { color: '#4F46E5', bgColor: '#E0E7FF', label: 'Scheduled' },
   in_progress: { color: '#2563EB', bgColor: '#DBEAFE', label: 'In Progress' },
   completed: { color: '#10B981', bgColor: '#ECFDF5', label: 'Completed' },
   cancelled: { color: '#EF4444', bgColor: '#FEE2E2', label: 'Cancelled' },
 };
 
 const WorkerJobsScreen = () => {
   const navigation = useNavigation();
   const [loading, setLoading] = useState(true);
   const [refreshing, setRefreshing] = useState(false);
   const [jobs, setJobs] = useState([]);
   const [activeTab, setActiveTab] = useState('scheduled');
   const [userId, setUserId] = useState(null); // Added userId state
 
   useEffect(() => {
     getCurrentUser();
   }, []);
 
   useEffect(() => {
     if (userId) {
       loadJobs();
     }
   }, [activeTab, userId]);
 
   const getCurrentUser = async () => {
     try {
       const storedUser = await AsyncStorage.getItem('user');
       if (storedUser) {
         const user = JSON.parse(storedUser);
         setUserId(user.id);
         console.log('User ID from storage:', user.id);
       } else {
         try {
           const userResponse = await client.get('/users/me');
           setUserId(userResponse.data.id);
           console.log('User ID from API:', userResponse.data.id);
         } catch (error) {
           console.error('Error fetching current user:', error);
         }
       }
     } catch (error) {
       console.error('Error getting user data:', error);
     }
   };
 
   const loadJobs = async () => {
     try {
       setLoading(true);
       
       if (!userId) {
         console.error('No user ID available');
         setLoading(false);
         return;
       }
       let statusParam;
       if (activeTab === 'all') {
         statusParam = undefined; // Don't filter by status
       } else {
         statusParam = activeTab;
       }
       console.log(`Fetching jobs for worker ${userId} with status ${statusParam || 'all'}`);
       const response = await client.get(`/workers/${userId}/jobs`, {
         params: { status: statusParam }
       });
       
       console.log('Jobs loaded:', response.data.length);
       setJobs(response.data);
     } catch (error) {
       console.error('Error loading jobs:', error);
     } finally {
       setLoading(false);
       setRefreshing(false);
     }
   };
 
   const onRefresh = () => {
     setRefreshing(true);
     loadJobs();
   };
 
   const navigateToJobDetail = (jobId) => {
     navigation.navigate('WorkerJobDetail', { jobId });
   };
 
   const renderJobItem = ({ item }) => {
     const statusConfig = JOB_STATUS[item.status] || JOB_STATUS.scheduled;
     
     return (
       <TouchableOpacity 
         style={styles.jobCard}
         onPress={() => navigateToJobDetail(item.id)}
         activeOpacity={0.7}
       >
         <View style={styles.jobHeader}>
           <Text style={styles.jobTitle}>{item.title}</Text>
           <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
             <Text style={[styles.statusText, { color: statusConfig.color }]}>
               {statusConfig.label}
             </Text>
           </View>
         </View>
         
         <View style={styles.timeContainer}>
           <Calendar size={16} color="#6B7280" />
           <Text style={styles.timeText}>
             {new Date(item.scheduled_start).toLocaleDateString()} • 
             {new Date(item.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
           </Text>
         </View>
         
         {item.description && (
           <Text style={styles.jobDescription} numberOfLines={2}>
             {item.description}
           </Text>
         )}
         
         {item.customer_name && (
           <View style={styles.customerContainer}>
             <Text style={styles.customerLabel}>Customer:</Text>
             <Text style={styles.customerText}>{item.customer_name}</Text>
           </View>
         )}
         
         {item.location && (
           <View style={styles.locationContainer}>
             <MapPin size={14} color="#6B7280" />
             <Text style={styles.locationText} numberOfLines={1}>
               {item.location}
             </Text>
           </View>
         )}
       </TouchableOpacity>
     );
   };
 
   const renderTabButton = (tabName, label, icon) => {
     const isActive = activeTab === tabName;
     const Icon = icon;
     
     return (
       <TouchableOpacity
         style={[styles.tabButton, isActive && styles.activeTabButton]}
         onPress={() => setActiveTab(tabName)}
         activeOpacity={0.7}
       >
         <Icon size={16} color={isActive ? '#4F46E5' : '#6B7280'} />
         <Text style={[styles.tabText, isActive && styles.activeTabText]}>
           {label}
         </Text>
       </TouchableOpacity>
     );
   };
 
   return (
     <SafeAreaView style={styles.safeArea}>
       <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
       
       {/* App Header */}
       <View style={styles.header}>
         <Text style={styles.headerTitle}>My Jobs</Text>
       </View>
       
       {/* Filter tabs */}
       <View style={styles.tabsContainer}>
         {renderTabButton('all', 'All', Briefcase)}
         {renderTabButton('scheduled', 'Scheduled', Calendar)}
         {renderTabButton('in_progress', 'In Progress', Clock)}
         {renderTabButton('completed', 'Completed', CheckCircle)}
       </View>
       
       {loading && jobs.length === 0 ? (
         <View style={styles.loadingContainer}>
           <ActivityIndicator size="large" color="#4F46E5" />
         </View>
       ) : (
         <FlatList
           data={jobs}
           renderItem={renderJobItem}
           keyExtractor={(item) => item.id}
           contentContainerStyle={styles.listContent}
           refreshControl={
             <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
           }
           ListEmptyComponent={
             <View style={styles.emptyState}>
               <Text style={styles.emptyText}>No jobs found</Text>
             </View>
           }
         />
       )}
     </SafeAreaView>
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
   tabsContainer: {
     flexDirection: 'row',
     paddingHorizontal: 16,
     paddingVertical: 12,
     backgroundColor: 'white',
     borderBottomWidth: 1,
     borderBottomColor: '#E5E7EB',
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
   tabButton: {
     flex: 1,
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingVertical: 8,
     borderRadius: 8,
   },
   activeTabButton: {
     backgroundColor: '#F5F3FF',
   },
   tabText: {
     fontSize: 12,
     marginLeft: 4,
     color: '#6B7280',
   },
   activeTabText: {
     color: '#4F46E5',
     fontWeight: '500',
   },
   loadingContainer: {
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
   },
   listContent: {
     padding: 16,
     paddingBottom: 24,
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
   jobHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: 8,
   },
   jobTitle: {
     fontSize: 16,
     fontWeight: '600',
     color: '#1F2937',
     flex: 1,
   },
   statusBadge: {
     paddingHorizontal: 8,
     paddingVertical: 4,
     borderRadius: 12,
   },
   statusText: {
     fontSize: 12,
     fontWeight: '500',
   },
   timeContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     marginBottom: 8,
   },
   timeText: {
     fontSize: 14,
     color: '#6B7280',
     marginLeft: 6,
   },
   jobDescription: {
     fontSize: 14,
     color: '#4B5563',
     marginBottom: 12,
     lineHeight: 20,
   },
   customerContainer: {
     flexDirection: 'row',
     marginBottom: 6,
   },
   customerLabel: {
     fontSize: 14,
     fontWeight: '500',
     color: '#4B5563',
     marginRight: 4,
   },
   customerText: {
     fontSize: 14,
     color: '#6B7280',
   },
   locationContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     marginTop: 4,
   },
   locationText: {
     fontSize: 14,
     color: '#6B7280',
     marginLeft: 6,
   },
   emptyState: {
     alignItems: 'center',
     justifyContent: 'center',
     padding: 32,
     backgroundColor: 'white',
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
         elevation: 1,
       },
     }),
   },
   emptyText: {
     fontSize: 16,
     color: '#6B7280',
     textAlign: 'center',
   },
 });
 
 export default WorkerJobsScreen;
import React, { useEffect, useState, createRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainerRef, CommonActions } from '@react-navigation/native';
import { Briefcase, Clock, FileText, User, Settings } from 'lucide-react-native';
export const navigationRef = createRef<NavigationContainerRef<any>>();
export function resetToLogin() {
  navigationRef.current?.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'Login' }]
    })
  );
}

export function resetToApp(userRole: string) {
  const targetScreen = userRole === 'worker' ? 'WorkerMain' : 'OwnerMain';
  navigationRef.current?.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: targetScreen }]
    })
  );
}
import { 
  RootStackParamList, 
  OwnerTabParamList, 
  WorkerTabParamList 
} from '../../types/navigation';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import JobsScreen from '../screens/dashboard/JobsScreen';
import JobDetailScreen from '../screens/dashboard/JobDetailScreen';
import CreateJobScreen from '../screens/dashboard/CreateJobScreen';
import WorkerDashboardScreen from '../screens/worker/WorkerDashboardScreen';
import WorkerJobsScreen from '../screens/worker/WorkerJobsScreen';
import WorkerTimeTrackingScreen from '../screens/worker/WorkerTimeTrackingScreen';
import WorkerProfileScreen from '../screens/worker/WorkerProfileScreen';
import WorkerJobDetailScreen from '../screens/worker/WorkerJobDetailScreen';
const Stack = createStackNavigator<RootStackParamList>();
const OwnerTab = createBottomTabNavigator<OwnerTabParamList>();
const WorkerTab = createBottomTabNavigator<WorkerTabParamList>();
const OwnerTabNavigator = () => (
  <OwnerTab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#1976d2',
    }}
  >
    <OwnerTab.Screen 
      name="Dashboard" 
      component={DashboardScreen} 
      options={{
        tabBarLabel: 'Dashboard',
        tabBarIcon: ({ color, size }) => <Briefcase color={color} size={size} />
      }}
    />
    <OwnerTab.Screen 
      name="Jobs" 
      component={JobsScreen} 
      options={{
        tabBarLabel: 'Jobs',
        tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />
      }}
    />
    <OwnerTab.Screen 
      name="Settings" 
      component={WorkerProfileScreen} // Using the worker profile as a placeholder
      options={{
        tabBarLabel: 'Settings',
        tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />
      }}
    />
  </OwnerTab.Navigator>
);
const WorkerTabNavigator = () => (
  <WorkerTab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#1976d2',
    }}
  >
    <WorkerTab.Screen 
      name="WorkerDashboard" 
      component={WorkerDashboardScreen}
      options={{
        tabBarLabel: 'Dashboard',
        tabBarIcon: ({ color, size }) => <Briefcase color={color} size={size} />
      }}
    />
    <WorkerTab.Screen 
      name="WorkerJobs" 
      component={WorkerJobsScreen}
      options={{
        tabBarLabel: 'My Jobs',
        tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />
      }}
    />
    <WorkerTab.Screen 
      name="WorkerTimeTracking" 
      component={WorkerTimeTrackingScreen}
      options={{
        tabBarLabel: 'Time',
        tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />
      }}
    />
    <WorkerTab.Screen 
      name="WorkerProfile" 
      component={WorkerProfileScreen}
      options={{
        tabBarLabel: 'Profile',
        tabBarIcon: ({ color, size }) => <User color={color} size={size} />
      }}
    />
  </WorkerTab.Navigator>
);

const AppNavigator = () => {
  const [initializing, setInitializing] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const userInfo = await AsyncStorage.getItem('user');
          if (userInfo) {
            const user = JSON.parse(userInfo);
            setUserRole(user.role);
          }
          setAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setInitializing(false);
      }
    };

    checkAuth();
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!authenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          {userRole === 'worker' ? (
            <Stack.Screen name="WorkerMain" component={WorkerMainStack} />
          ) : (
            <Stack.Screen name="OwnerMain" component={OwnerMainStack} />
          )}
        </>
      )}
    </Stack.Navigator>
  );
};
const WorkerMainStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="WorkerTabs" component={WorkerTabNavigator} />
    <Stack.Screen 
      name="WorkerJobDetail" 
      component={WorkerJobDetailScreen}
      options={{ 
        headerShown: true,
        title: 'Job Details' 
      }}
    />
  </Stack.Navigator>
);

const OwnerMainStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="OwnerTabs" component={OwnerTabNavigator} />
    <Stack.Screen 
      name="JobDetail" 
      component={JobDetailScreen}
      options={{ 
        headerShown: false, // change back to true if fails!!!!!!!!!!!!!!! --------------------------------------- 
        title: 'Job Details' 
      }}
    />
    <Stack.Screen 
      name="CreateJob" 
      component={CreateJobScreen}
      options={{ 
        headerShown: true,
        title: 'Create New Job' 
      }}
    />
  </Stack.Navigator>
);

export default AppNavigator;
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Briefcase, Clock, FileText, User } from 'lucide-react-native';
import WorkerDashboardScreen from '../screens/worker/WorkerDashboardScreen';
import WorkerJobsScreen from '../screens/worker/WorkerJobsScreen';
import WorkerTimeTrackingScreen from '../screens/worker/WorkerTimeTrackingScreen';
import WorkerProfileScreen from '../screens/worker/WorkerProfileScreen';

const Tab = createBottomTabNavigator();

const WorkerTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1976d2',
      }}
    >
      <Tab.Screen 
        name="WorkerDashboard" 
        component={WorkerDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Briefcase color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="WorkerJobs" 
        component={WorkerJobsScreen}
        options={{
          tabBarLabel: 'My Jobs',
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="WorkerTimeTracking" 
        component={WorkerTimeTrackingScreen}
        options={{
          tabBarLabel: 'Time',
          tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="WorkerProfile" 
        component={WorkerProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />
        }}
      />
    </Tab.Navigator>
  );
};

export default WorkerTabNavigator;
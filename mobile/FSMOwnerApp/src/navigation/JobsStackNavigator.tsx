
import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import JobsScreen from '../screens/dashboard/JobsScreen';
import JobDetailScreen from '../screens/dashboard/JobDetailScreen';
import CreateJobScreen from '../screens/dashboard/CreateJobScreen';
export type JobsStackParamList = {
  JobsList: {
    refresh?: boolean;
    success?: boolean;
    message?: string;
  } | undefined;
  JobDetail: { jobId: string };
  CreateJob: undefined;
};

const Stack = createStackNavigator<JobsStackParamList>();

export const JobsStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true, 
        headerStyle: {
          backgroundColor: '#FFFFFF',
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
              elevation: 2,
            },
          }),
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: '#111827',
        },
        cardStyle: { backgroundColor: 'white' }, // Ensure consistent background
      }}
      initialRouteName="JobsList"
    >
      <Stack.Screen 
        name="JobsList" 
        component={JobsScreen} 
        options={{ 
          title: 'Jobs',
        }} 
      />
      <Stack.Screen 
        name="JobDetail" 
        component={JobDetailScreen} 
        options={{ 
          title: 'Job Details',
        }} 
      />
      <Stack.Screen 
        name="CreateJob" 
        component={CreateJobScreen} 
        options={{ 
          title: 'Create Job',
        }} 
      />
    </Stack.Navigator>
  );
};

export default JobsStackNavigator;
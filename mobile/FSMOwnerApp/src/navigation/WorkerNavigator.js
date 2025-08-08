import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import WorkerTabNavigator from './WorkerTabNavigator';
import WorkerJobDetailScreen from '../screens/worker/WorkerJobDetailScreen';

const Stack = createStackNavigator();

const WorkerNavigator = () => {
  return (
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
};

export default WorkerNavigator;
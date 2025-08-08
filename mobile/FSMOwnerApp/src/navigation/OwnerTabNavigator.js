import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Briefcase, FileText, Settings, Users, DollarSign, UserCog } from 'lucide-react-native';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import JobsStackNavigator from './JobsStackNavigator';
import CustomersScreen from '../screens/dashboard/CustomersScreen';
import WorkerProfileScreen from '../screens/worker/WorkerProfileScreen';

const Tab = createBottomTabNavigator();

const OwnerTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#1976d2',
        headerStyle: {
          backgroundColor: '#FFFFFF',
          shadowOpacity: 0.1,
          elevation: 2,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Briefcase color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Jobs" 
        component={JobsStackNavigator} 
        options={{
          tabBarLabel: 'Jobs',
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Customers" 
        component={CustomersScreen} 
        options={{
          tabBarLabel: 'Customers',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      {/* <Tab.Screen 
        name="Financials" 
        component={FinancialsScreen} 
        options={{
          tabBarLabel: 'Financials',
          tabBarIcon: ({ color, size }) => <DollarSign color={color} size={size} />,
        }}
      /> */}
      {/* <Tab.Screen 
        name="Workers" 
        component={WorkersScreen} 
        options={{
          tabBarLabel: 'Workers',
          tabBarIcon: ({ color, size }) => <UserCog color={color} size={size} />,
        }}
      /> */}
      <Tab.Screen 
        name="Settings" 
        component={WorkerProfileScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default OwnerTabNavigator;
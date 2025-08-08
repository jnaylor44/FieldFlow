import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import OwnerTabNavigator from './OwnerTabNavigator'; // We'll create this next
import JobDetailScreen from '../screens/dashboard/JobDetailScreen';
import CreateJobScreen from '../screens/dashboard/CreateJobScreen';
import CustomersScreen from '../screens/dashboard/CustomersScreen';
import EditCustomerScreen from '../screens/dashboard/EditCustomerScreen';
import CustomerJobsScreen from '../screens/dashboard/CustomerJobsScreen';

const Stack = createStackNavigator();

const OwnerNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OwnerTabs" component={OwnerTabNavigator} />
      <Stack.Screen 
        name="JobDetail" 
        component={JobDetailScreen}
        options={{ 
          headerShown: true,
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
      <Stack.Screen name="Customers" component={CustomersScreen} />
<Stack.Screen 
  name="EditCustomer" 
  component={EditCustomerScreen}
  options={({ route }) => ({ 
    title: route.params?.customer ? 'Edit Customer' : 'Add Customer'
  })} 
/>
<Stack.Screen 
  name="CustomerJobs" 
  component={CustomerJobsScreen}
  options={({ route }) => ({ 
    title: `${route.params?.customerName}'s Jobs`
  })} 
/>
    </Stack.Navigator>
  );
};

export default OwnerNavigator;
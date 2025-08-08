import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/index';

export default function AppRoot() {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}
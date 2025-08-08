import client from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const login = async (email, password) => {
  try {
    const response = await client.post('/auth/login', { email, password });
    const { token, user } = response.data;
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    
    return { token, user };
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('user_info');
    if (__DEV__) {
      const { DevSettings } = require('react-native');
      if (DevSettings.reload) {
        DevSettings.reload();
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error during logout:', error);
    return false;
  }
};

export const getCurrentUser = async () => {
  try {
    const userString = await AsyncStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export default {
  login,
  logout,
  getCurrentUser
};
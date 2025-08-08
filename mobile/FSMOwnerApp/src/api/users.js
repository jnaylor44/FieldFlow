import apiClient from './client';

export const users = {
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/users/me');
      return response;
    } catch (error) {
      throw error;
    }
  },
  listUsers: async () => {
    try {
      const response = await apiClient.get('/users');
      return response;
    } catch (error) {
      throw error;
    }
  },
  getUser: async (userId) => {
    try {
      const response = await apiClient.get(`/users/${userId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  createUser: async (userData) => {
    try {
      const response = await apiClient.post('/users', userData);
      return response;
    } catch (error) {
      throw error;
    }
  },
  updateUser: async (userId, userData) => {
    try {
      const response = await apiClient.put(`/users/${userId}`, userData);
      return response;
    } catch (error) {
      throw error;
    }
  },
  deleteUser: async (userId) => {
    try {
      const response = await apiClient.delete(`/users/${userId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
};

export default users;
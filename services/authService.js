import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  login: async (username, password) => {
    try {
      console.log('🔐 Logging in:', username);

      const res = await api.post('/auth/login', {
        username,
        password,
      });

      if (!res?.data?.data) {
        throw new Error('Login response invalid');
      }

      const { token, user } = res.data.data;

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      console.log('✅ Login OK - token saved');

      return { token, user };
    } catch (error) {
      console.log('❌ Login error:', error);
      throw error;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  },

  getToken: async () => {
    return await AsyncStorage.getItem('token');
  },

  getUser: async () => {
    const json = await AsyncStorage.getItem('user');
    return json ? JSON.parse(json) : null;
  },

  isLoggedIn: async () => {
    const token = await AsyncStorage.getItem('token');
    return !!token;
  },
};
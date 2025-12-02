// src/services/authService.js
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

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

      if (!token) {
        throw new Error('No token returned from login');
      }

      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

      // Optionally set default header to speed up requests (not required if interceptor present)
      if (api.defaults && api.defaults.headers && api.defaults.headers.common) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      console.log('✅ Login OK - token saved');

      return { token, user };
    } catch (error) {
      console.log('❌ Login error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      // gọi backend để backend clear cookies nếu server đang set cookie
      try {
        await api.post('/auth/logout');
      } catch (e) {
        // ignore backend errors - still proceed to clear local
        console.warn('Logout API failed (ignored):', e?.response?.data || e.message);
      }

      // xóa storage local
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);

      // xóa default Authorization header của axios (nếu bạn set khi login)
      if (api.defaults && api.defaults.headers && api.defaults.headers.common) {
        delete api.defaults.headers.common['Authorization'];
      }

      return true;
    } catch (error) {
      console.error('authService.logout error', error);
      return false;
    }
  },

  getToken: async () => {
    return await AsyncStorage.getItem(TOKEN_KEY);
  },

  getUser: async () => {
    const json = await AsyncStorage.getItem(USER_KEY);
    return json ? JSON.parse(json) : null;
  },

  isLoggedIn: async () => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return !!token;
  },
};

export default authService;

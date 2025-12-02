import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';
import { resetToLogin } from '../services/navigationService'; // from src/navigationService

console.log('🔌 [API] Initializing with baseURL:', API_URL);

// Tạo axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =========== REQUEST INTERCEPTOR ===========
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`📤 [API] ${config.method.toUpperCase()} ${config.url} | Token attached`);
      } else {
        console.log(`⚠️ [API] No token found for ${config.url}`);
      }
    } catch (e) {
      console.log('❌ Error reading token:', e);
    }

    return config;
  },
  (error) => {
    console.log('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// =========== RESPONSE INTERCEPTOR ===========
api.interceptors.response.use(
  (response) => {
    console.log(`✅ [API] ${response.status} | ${response.config.url}`);
    return response;
  },
  async (error) => {
    const status = error.response?.status;

    console.log(`❌ [API Error] ${status} | ${error.config?.url}`);

    // Token hết hạn → xoá token → chuyển về Login
    if (status === 401) {
      try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');

        // remove axios default header if set
        if (api.defaults && api.defaults.headers && api.defaults.headers.common) {
          delete api.defaults.headers.common['Authorization'];
        }

        console.log('🔒 Token expired → cleared');

        // Reset navigation về màn hình Login
        resetToLogin();
      } catch (e) {
        console.log('❌ Error clearing token:', e);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

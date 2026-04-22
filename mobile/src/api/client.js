import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your computer's local IP when testing on a real device
// e.g. 'http://192.168.1.5:5000/api'
export const BASE_URL = 'http://localhost:5001/api';
export const SOCKET_URL = 'http://localhost:5001';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Attach token to every request
client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default client;

import axios from 'axios';

export const BASE_URL   = 'http://localhost:5001/api';
export const SOCKET_URL = 'http://localhost:5001';

const client = axios.create({ baseURL: BASE_URL, timeout: 10000 });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;

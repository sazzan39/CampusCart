import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../api/auth';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  loading: true,

  // Called on app launch — restore session from storage
  init: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const res = await authApi.getMe();
        set({ user: res.data.user, token, loading: false });
      } else {
        set({ loading: false });
      }
    } catch {
      await AsyncStorage.removeItem('token');
      set({ user: null, token: null, loading: false });
    }
  },

  login: async (email, password) => {
    const res = await authApi.login(email, password);
    const { token, user } = res.data;
    await AsyncStorage.setItem('token', token);
    set({ user, token });
    return user;
  },

  register: async (data) => {
    const res = await authApi.register(data);
    const { token, user } = res.data;
    await AsyncStorage.setItem('token', token);
    set({ user, token });
    return user;
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    set({ user: null, token: null });
  },

  updateUser: (updates) => {
    set((state) => ({ user: { ...state.user, ...updates } }));
  },
}));

export default useAuthStore;

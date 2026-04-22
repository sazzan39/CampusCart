import { create } from 'zustand';
import client from '../api/client';

const useAuthStore = create((set) => ({
  user: null,
  vendor: null,
  loading: true,

  init: async () => {
    const token = localStorage.getItem('token');
    if (!token) { set({ loading: false }); return; }
    try {
      const res = await client.get('/auth/me');
      set({ user: res.data.user, vendor: res.data.vendor, loading: false });
    } catch {
      localStorage.removeItem('token');
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    const res = await client.post('/auth/login', { email, password });
    const { token, user } = res.data;
    if (user.role !== 'vendor') throw new Error('Not a vendor account');
    localStorage.setItem('token', token);
    const me = await client.get('/auth/me');
    set({ user, vendor: me.data.vendor });
    return user;
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, vendor: null });
  },

  setVendor: (vendor) => set((s) => ({ vendor: { ...s.vendor, ...vendor } })),
}));

export default useAuthStore;

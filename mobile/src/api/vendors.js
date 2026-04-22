import client from './client';

export const getVendors = () =>
  client.get('/vendors');

export const getVendor = (id) =>
  client.get(`/vendors/${id}`);

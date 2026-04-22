import client from './client';

export const getAvailableOrders = () =>
  client.get('/delivery/available');

export const acceptOrder = (id) =>
  client.post(`/delivery/orders/${id}/accept`);

export const markDelivered = (id) =>
  client.patch(`/delivery/orders/${id}/delivered`);

export const getMyDeliveries = () =>
  client.get('/delivery/my');

export const getEarnings = () =>
  client.get('/delivery/earnings');

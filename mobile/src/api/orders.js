import client from './client';

export const placeOrder = (data) =>
  client.post('/orders', data);

export const getMyOrders = () =>
  client.get('/orders/my');

export const getOrder = (id) =>
  client.get(`/orders/${id}`);

export const cancelOrder = (id) =>
  client.patch(`/orders/${id}/cancel`);

export const rateOrder = (id, stars, comment) =>
  client.post(`/orders/${id}/rate`, { stars, comment });

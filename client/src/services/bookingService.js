import api from './api';

export const bookingService = {
  list: (params) => api.get('/bookings', { params }),
  get: (id) => api.get(`/bookings/${id}`),
  create: (payload) => api.post('/bookings', payload),
  update: (id, payload) => api.put(`/bookings/${id}`, payload),
};

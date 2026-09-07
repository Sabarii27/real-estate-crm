import api from './api';

export const leadService = {
  list: (params) => api.get('/leads', { params }),
  get: (id) => api.get(`/leads/${id}`),
  create: (payload) => api.post('/leads', payload),
  update: (id, payload) => api.put(`/leads/${id}`, payload),
  addNote: (id, text) => api.post(`/leads/${id}/notes`, { text }),
  remove: (id) => api.delete(`/leads/${id}`),
};

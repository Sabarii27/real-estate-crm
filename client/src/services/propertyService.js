import api from './api';

export const propertyService = {
  // Projects
  listProjects: () => api.get('/projects'),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (payload) => api.post('/projects', payload),
  updateProject: (id, payload) => api.put(`/projects/${id}`, payload),
  removeProject: (id) => api.delete(`/projects/${id}`),

  // Buildings
  listBuildings: (params) => api.get('/buildings', { params }),
  getBuilding: (id) => api.get(`/buildings/${id}`),
  createBuilding: (payload) => api.post('/buildings', payload),
  updateBuilding: (id, payload) => api.put(`/buildings/${id}`, payload),
  removeBuilding: (id) => api.delete(`/buildings/${id}`),

  // Units
  listUnits: (params) => api.get('/units', { params }),
  getUnit: (id) => api.get(`/units/${id}`),
  createUnit: (payload) => api.post('/units', payload),
  updateUnit: (id, payload) => api.put(`/units/${id}`, payload),
  removeUnit: (id) => api.delete(`/units/${id}`),
};

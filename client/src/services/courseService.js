import api from './api';

/**
 * Course service – all course-related API calls.
 * Fetches from the Express backend, not from local mock data directly.
 */
const courseService = {
  getAll: (params = {}) => api.get('/courses', { params }).then((r) => r.data),
  getById: (id) => api.get(`/courses/${id}`).then((r) => r.data),
  create: (data) => api.post('/courses', data).then((r) => r.data),
  update: (id, data) => api.put(`/courses/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/courses/${id}`).then((r) => r.data),
  getFeatured: () => api.get('/courses', { params: { featured: 'true', limit: 6 } }).then((r) => r.data),
  getTrending: () => api.get('/courses', { params: { trending: 'true', limit: 6 } }).then((r) => r.data),
  getTopRated: () => api.get('/courses', { params: { topRated: 'true', limit: 6 } }).then((r) => r.data),
  getCategories: () => api.get('/categories').then((r) => r.data),
  getReviews: (courseId, params) => api.get(`/reviews/course/${courseId}`, { params }).then((r) => r.data),
  submitReview: (data) => api.post('/reviews', data).then((r) => r.data),
};

export default courseService;

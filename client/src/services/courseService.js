
import api from './api';
import supabase from './supabase';

/**
 * Course service – all course-related API calls.
 * Fetches from the Express backend.
 */
const courseService = {
  // Get all courses
  getAll: (params = {}) =>
    api.get('/courses', { params }).then((r) => r.data),

  // Get courses created by the logged-in instructor
  getMine: () =>
    api.get('/courses/mine').then((r) => r.data),

  // Get one course
  getById: (id) =>
    api.get(`/courses/${id}`).then((r) => r.data),

  // Create a course
  create: (data) =>
    api.post('/courses', data).then((r) => r.data),

  // Update a course
  update: (id, data) =>
    api.put(`/courses/${id}`, data).then((r) => r.data),

  // Delete a course
  remove: (id) =>
    api.delete(`/courses/${id}`).then((r) => r.data),

  // Featured courses
  getFeatured: () =>
    api.get('/courses', {
      params: { featured: 'true', limit: 6 },
    }).then((r) => r.data),

  // Trending courses
  getTrending: () =>
    api.get('/courses', {
      params: { trending: 'true', limit: 6 },
    }).then((r) => r.data),

  // Top-rated courses
  getTopRated: () =>
    api.get('/courses', {
      params: { topRated: 'true', limit: 6 },
    }).then((r) => r.data),

  // Get categories
  getCategories: () =>
    api.get('/categories').then((r) => r.data),

  // Get course reviews
  getReviews: (courseId, params) =>
    api.get(`/reviews/course/${courseId}`, { params })
      .then((r) => r.data),

  // Submit a review using the logged-in user's Supabase token
  submitReview: async (data) => {
    const { data: sessionData, error } =
      await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    const accessToken = sessionData?.session?.access_token;

    if (!accessToken) {
      throw new Error('Please log in before submitting a review.');
    }

    return api.post('/reviews', data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }).then((r) => r.data);
  },
};

export default courseService;


import api from './api';
import supabase from './supabase';

const getAuthenticatedRequest = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) throw error;

  if (!session?.user) {
    throw new Error('Please log in with your real account first.');
  }

  return {
    userId: session.user.id,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  };
};

const enrollmentService = {
  getEnrollments: async () => {
    const auth = await getAuthenticatedRequest();

    return api
      .get('/enrollments', {
        headers: auth.headers,
      })
      .then((r) => r.data);
  },

  getMyEnrollments: async () => {
    return enrollmentService.getEnrollments();
  },

  getById: async (id) => {
    const auth = await getAuthenticatedRequest();

    return api
      .get(`/enrollments/${id}`, {
        headers: auth.headers,
      })
      .then((r) => r.data);
  },

  enroll: async (courseId) => {
    const auth = await getAuthenticatedRequest();

    return api
      .post(
        '/enrollments',
        { courseId },
        { headers: auth.headers }
      )
      .then((r) => r.data);
  },

  markLessonComplete: async (enrollmentIdOrObj, lessonId) => {
    const auth = await getAuthenticatedRequest();

    const payload =
      typeof enrollmentIdOrObj === 'object'
        ? enrollmentIdOrObj
        : { enrollmentId: enrollmentIdOrObj, lessonId };

    return api
      .post('/enrollments/lesson-complete', payload, {
        headers: auth.headers,
      })
      .then((r) => r.data);
  },

  updateProgress: async (enrollmentId, progress) => {
    const auth = await getAuthenticatedRequest();

    return api
      .post(
        '/enrollments/progress',
        { enrollmentId, progress },
        { headers: auth.headers }
      )
      .then((r) => r.data);
  },

  getDashboard: async () => {
    const auth = await getAuthenticatedRequest();

    return api
      .get('/instructor/dashboard', {
        headers: auth.headers,
      })
      .then((r) => r.data);
  },

  getAdminDashboard: async () => {
    const auth = await getAuthenticatedRequest();

    return api
      .get('/admin/dashboard', {
        headers: auth.headers,
      })
      .then((r) => r.data);
  },
};

export default enrollmentService;

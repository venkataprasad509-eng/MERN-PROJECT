
import api from './api';

/**
 * Assessment service
 * Handles assignments and quizzes through the Express backend.
 */
const assessmentService = {
  // Instructor: create an assignment or quiz
  create: (data) =>
    api.post('/assessments', data).then((r) => r.data),

  // Instructor: get assessments for one of their courses
  getInstructorAssessments: (courseId) =>
    api.get(`/assessments/instructor/${courseId}`)
      .then((r) => r.data),

  // Student: get published assessments for an enrolled course
  getStudentAssessments: (courseId) =>
    api.get(`/assessments/course/${courseId}`)
      .then((r) => r.data),
};

export default assessmentService;

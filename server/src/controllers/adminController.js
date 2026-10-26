const { courseService } = require('../services/courseService');
const { enrollmentService } = require('../services/enrollmentService');
const { mockCategories } = require('../data/mockCategories');
const { asyncHandler } = require('../middleware/errorHandler');

const adminController = {
  getDashboard: asyncHandler(async (_req, res) => {
    const allCourses = courseService.getAllCoursesAdmin();
    const allEnrollments = enrollmentService.getAllEnrollments();

    const monthlyRevenue = [
      { month: 'Aug 2023', revenue: 320000, enrollments: 1240 },
      { month: 'Sep 2023', revenue: 415000, enrollments: 1580 },
      { month: 'Oct 2023', revenue: 389000, enrollments: 1420 },
      { month: 'Nov 2023', revenue: 520000, enrollments: 1890 },
      { month: 'Dec 2023', revenue: 680000, enrollments: 2340 },
      { month: 'Jan 2024', revenue: 745000, enrollments: 2680 },
    ];

    const mockUsers = [
      { id: 'u1', name: 'Priya Sharma', email: 'priya@example.com', role: 'student', joinedAt: '2024-01-01' },
      { id: 'u2', name: 'Rahul Verma', email: 'rahul@example.com', role: 'student', joinedAt: '2024-01-05' },
      { id: 'u3', name: 'Dr. Angela Yu', email: 'angela@example.com', role: 'instructor', joinedAt: '2023-01-15' },
      { id: 'u4', name: 'Maximilian S.', email: 'max@example.com', role: 'instructor', joinedAt: '2023-03-20' },
      { id: 'u5', name: 'Admin User', email: 'admin@example.com', role: 'admin', joinedAt: '2023-01-01' },
    ];

    res.json({
      success: true,
      devOnly: true,
      note: 'DEV ONLY: All statistics are mock data. No real admin operations are performed.',
      dashboard: {
        overview: {
          totalStudents: 45820,
          totalInstructors: 48,
          totalCourses: allCourses.length,
          totalEnrollments: 312780,
          totalRevenue: 28450000,
          activeUsers: 12340,
        },
        courses: allCourses,
        categories: mockCategories,
        recentUsers: mockUsers,
        monthlyRevenue,
        topCourses: allCourses
          .filter((c) => c.status === 'published')
          .sort((a, b) => b.enrolledStudents - a.enrolledStudents)
          .slice(0, 5)
          .map((c) => ({ id: c.id, title: c.title, enrolledStudents: c.enrolledStudents, revenue: c.price * c.enrolledStudents, rating: c.rating })),
      },
    });
  }),
};

module.exports = { adminController };

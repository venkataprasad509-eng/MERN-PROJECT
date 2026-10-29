
const { courseService } = require('../services/courseService');
const { enrollmentService } = require('../services/enrollmentService');
const { mockCategories } = require('../data/mockCategories');
const { asyncHandler } = require('../middleware/errorHandler');

const adminController = {
  getDashboard: asyncHandler(async (_req, res) => {
    const [allCourses, allEnrollments] = await Promise.all([
      courseService.getAllCoursesAdmin(),
      enrollmentService.getAllEnrollments(),
    ]);

    const enrollments = allEnrollments || [];
    const courses = allCourses || [];

    // Count unique students represented in enrollment records.
    const studentIds = new Set(
      enrollments
        .map((enrollment) => enrollment.studentId || enrollment.student_id)
        .filter(Boolean)
    );

    // Count unique instructors represented in course records.
    const instructorIds = new Set(
      courses
        .map((course) => course.instructorId || course.instructor_id)
        .filter(Boolean)
    );

    // Build monthly enrollment totals from actual enrollment timestamps.
    const monthlyMap = new Map();

    for (const enrollment of enrollments) {
      const dateValue =
        enrollment.enrolledAt ||
        enrollment.enrolled_at ||
        enrollment.createdAt ||
        enrollment.created_at;

      if (!dateValue) continue;

      const date = new Date(dateValue);
      if (Number.isNaN(date.getTime())) continue;

      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}`;

      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          month: date.toLocaleDateString('en', {
            month: 'short',
            year: 'numeric',
          }),
          enrollments: 0,
        });
      }

      monthlyMap.get(key).enrollments += 1;
    }

    const monthlyEnrollments = [...monthlyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([, value]) => value);

    const topCourses = [...courses]
      .sort(
        (a, b) =>
          Number(b.enrolledStudents || 0) -
          Number(a.enrolledStudents || 0)
      )
      .slice(0, 5)
      .map((course) => ({
        id: course.id,
        title: course.title,
        enrolledStudents: Number(course.enrolledStudents || 0),
        rating: Number(course.rating || 0),
        price: Number(course.price || 0),
      }));

    res.json({
      success: true,
      devOnly: false,
      dashboard: {
        overview: {
          totalStudents: studentIds.size,
          totalInstructors: instructorIds.size,
          totalCourses: courses.length,
          totalEnrollments: enrollments.length,

          // No payment transaction data has been verified,
          // so revenue is intentionally unavailable.
          totalRevenue: null,
        },
        courses,
        categories: mockCategories,
        recentUsers: [],
        reviews: [],
        coupons: [],
        monthlyEnrollments,
        topCourses,
      },
    });
  }),
};

module.exports = { adminController };

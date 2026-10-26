
const { courseService } = require('../services/courseService');
const { enrollmentService } = require('../services/enrollmentService');
const { asyncHandler } = require('../middleware/errorHandler');

const instructorController = {
  getDashboard: asyncHandler(async (req, res) => {
    const instructorId = req.query.instructorId;

    if (!instructorId) {
      return res.status(400).json({
        success: false,
        message: 'Instructor ID is required.',
      });
    }

    // Fetch instructor courses from Supabase.
    const myCourses = await courseService.getCoursesByInstructor(
      instructorId
    );

    // Enrollment data is still handled by the existing service.
    const allEnrollments = await enrollmentService.getAllEnrollments();

    const myCourseIds = myCourses.map((course) => course.id);

    const myEnrollments = allEnrollments.filter((enrollment) =>
      myCourseIds.includes(String(enrollment.courseId))
    );

    const totalStudents = myEnrollments.length;

    const totalRevenue = myCourses.reduce(
      (sum, course) =>
        sum + course.price * (course.enrolledStudents || 0),
      0
    );

    const avgRating =
      myCourses.reduce((sum, course) => sum + course.rating, 0) /
      (myCourses.length || 1);

    res.json({
      success: true,
      dashboard: {
        totalCourses: myCourses.length,
        publishedCourses: myCourses.filter(
          (course) => course.status === 'published'
        ).length,
        draftCourses: myCourses.filter(
          (course) => course.status === 'draft'
        ).length,
        totalStudents,
        totalRevenue,
        avgRating,
        courses: myCourses,

        // Placeholder data until real monthly revenue is implemented.
        monthlyRevenue: [],
      },
    });
  }),
};

module.exports = { instructorController };

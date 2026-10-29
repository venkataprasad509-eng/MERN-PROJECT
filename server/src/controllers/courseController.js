
const { courseService } = require('../services/courseService');
const { asyncHandler } = require('../middleware/errorHandler');

const courseController = {
  getAll: asyncHandler(async (req, res) => {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      level,
      minRating,
      sort,
      page,
      limit,
      featured,
      trending,
      topRated,
    } = req.query;

    const data = await courseService.getAllCourses({
      search,
      category,
      minPrice,
      maxPrice,
      level,
      minRating,
      sort,
      page,
      limit,
      featured,
      trending,
      topRated,
    });

    res.json({ success: true, ...data });
  }),

  // Get courses created by the logged-in instructor
  getMine: asyncHandler(async (req, res) => {
    const courses = await courseService.getInstructorCourses(
      req.userSupabase,
      req.user.id
    );

    res.json({
      success: true,
      courses,
    });
  }),

  getOne: asyncHandler(async (req, res) => {
    const course = await courseService.getCourseById(req.params.id);
    res.json({ success: true, course });
  }),

  create: asyncHandler(async (req, res) => {
    const course = await courseService.createCourse(
      {
        ...req.body,
        instructorId: req.user.id,
      },
      req.userSupabase
    );

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course,
    });
  }),

  update: asyncHandler(async (req, res) => {
    const course = await courseService.updateCourse(
      req.params.id,
      req.body
    );

    res.json({
      success: true,
      message: 'Course updated successfully',
      course,
    });
  }),

  remove: asyncHandler(async (req, res) => {
    const course = await courseService.deleteCourse(req.params.id);

    res.json({
      success: true,
      message: 'Course deleted successfully',
      course,
    });
  }),
};

module.exports = { courseController };

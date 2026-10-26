
const { courseService } = require('../services/courseService');
const { asyncHandler } = require('../middleware/errorHandler');

const courseController = {
  /** GET /api/courses */
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

  /** GET /api/courses/:id */
  getOne: asyncHandler(async (req, res) => {
    const course = await courseService.getCourseById(req.params.id);

    res.json({ success: true, course });
  }),

  /** POST /api/courses */
  create: asyncHandler(async (req, res) => {
    const course = await courseService.createCourse(req.body);

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course,
    });
  }),

  /** PUT /api/courses/:id */
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

  /** DELETE /api/courses/:id */
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

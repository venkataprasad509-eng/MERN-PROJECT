
import InstructorStudents from '../components/InstructorStudents';
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Users,
  Star,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  LayoutDashboard,
  Video,
  Search,
  GraduationCap,
  ChevronRight,
  X,
  BookMarked,
} from 'lucide-react';

import courseService from '../services/courseService';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/helpers';
import { toast } from '../utils/toast';
import { useScrollToTop } from '../hooks/useCustomHooks';
import ManageLessons from '../components/ManageLessons';

const INITIAL_FORM = {
  title: '',
  shortDescription: '',
  price: '',
  level: 'Beginner',
  category: 'Web Development',
  thumbnail: '',
  status: 'draft',
};

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'courses', label: 'My Courses', icon: BookOpen },
  { id: 'lessons', label: 'Lessons & Videos', icon: Video },
  { id: 'students', label: 'My Students', icon: Users },
];

const InstructorDashboard = () => {
  useScrollToTop();

  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeSection, setActiveSection] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState(INITIAL_FORM);

  // Load courses belonging to the logged-in instructor.
  useEffect(() => {
    if (!user?.id) {
      setLoading(true);
      return;
    }

    let cancelled = false;

    setLoading(true);

    courseService
      .getMine()
      .then((data) => {
        if (!cancelled) {
          setCourses(data.courses || []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(
            err.response?.data?.message ||
              err.message ||
              'Failed to load your courses'
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Dashboard statistics.
  const totalStudents = courses.reduce(
    (sum, course) =>
      sum + Number(course.enrolledStudents || 0),
    0
  );

  const publishedCourses = courses.filter(
    (course) => course.status === 'published'
  ).length;

  const ratedCourses = courses.filter(
    (course) => Number(course.rating) > 0
  );

  const averageRating = ratedCourses.length
    ? (
        ratedCourses.reduce(
          (sum, course) =>
            sum + Number(course.rating || 0),
          0
        ) / ratedCourses.length
      ).toFixed(1)
    : '—';

  // Search and filter courses.
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch = (course.title || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        course.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [courses, searchTerm, statusFilter]);

  const handleFormChange = (e) => {
    setForm((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));
  };

  const openCreateForm = () => {
    setEditingCourse(null);
    setForm({ ...INITIAL_FORM });
    setShowCreateForm(true);
  };

  const resetForm = () => {
    setShowCreateForm(false);
    setEditingCourse(null);
    setForm({ ...INITIAL_FORM });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingCourse) {
        const data = await courseService.update(
          editingCourse.id,
          {
            ...form,
            instructor: user?.name || '',
          }
        );

        setCourses((previous) =>
          previous.map((course) =>
            course.id === editingCourse.id
              ? data.course
              : course
          )
        );

        toast.success('Course updated successfully!');
      } else {
        const data = await courseService.create({
          ...form,
          instructor: user?.name || '',
          instructorId: user.id,
        });

        setCourses((previous) => [
          data.course,
          ...previous,
        ]);

        toast.success('Course created successfully!');
      }

      resetForm();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          'Failed to save course'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this course?'
      )
    ) {
      return;
    }

    try {
      await courseService.remove(id);

      setCourses((previous) =>
        previous.filter((course) => course.id !== id)
      );

      toast.success('Course deleted successfully!');
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          'Failed to delete course'
      );
    }
  };

  const openEdit = (course) => {
    setEditingCourse(course);

    setForm({
      title: course.title || '',
      shortDescription: course.shortDescription || '',
      price: course.price ?? '',
      level: course.level || 'Beginner',
      category: course.category || 'Web Development',
      thumbnail:
        course.thumbnail || course.imageUrl || '',
      status: course.status || 'draft',
    });

    setShowCreateForm(true);
  };

  const openLessons = (course) => {
    setSelectedCourse(course);
  };

  const renderCourseCard = (course) => (
    <div
      key={course.id}
      className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col sm:flex-row gap-4">
        <img
          src={
            course.thumbnail ||
            course.imageUrl ||
            course.image_url ||
            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format'
          }
          alt={course.title}
          className="w-full sm:w-36 h-36 sm:h-24 object-cover rounded-xl shrink-0"
          onError={(e) => {
            e.currentTarget.src =
              'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format';
          }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                course.status === 'published'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {course.status || 'draft'}
            </span>

            <span className="text-xs text-gray-500">
              {course.category || 'Uncategorized'}
            </span>
          </div>

          <h3 className="font-bold text-gray-900 text-base line-clamp-1">
            {course.title}
          </h3>

          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {course.shortDescription ||
              'No course description added yet.'}
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {Number(
                course.enrolledStudents || 0
              ).toLocaleString()}{' '}
              students
            </span>

            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              {Number(course.rating || 0).toFixed(1)}
            </span>

            <span className="font-semibold text-gray-800">
              {formatPrice(course.price || 0)}
            </span>
          </div>
        </div>

        <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0">
          <button
            onClick={() => openLessons(course)}
            className="text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-2 rounded-lg flex items-center gap-1.5"
            title="Manage lessons"
          >
            <Video className="w-3.5 h-3.5" />
            Lessons
          </button>

          <div className="flex items-center gap-1">
            <Link
              to={`/courses/${course.id}`}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
              title="Preview course"
            >
              <Eye className="w-4 h-4" />
            </Link>

            <button
              onClick={() => openEdit(course)}
              className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
              title="Edit course"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleDelete(course.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              title="Delete course"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page heading */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-medium text-indigo-600 mb-1">
              INSTRUCTOR WORKSPACE
            </p>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome back, {user?.name || 'Instructor'}!
            </h1>

            <p className="text-gray-500 text-sm mt-2">
              Manage your courses, lessons, and students from one place.
            </p>
          </div>

          <button
            onClick={openCreateForm}
            className="btn-primary flex items-center justify-center gap-2 px-5 py-3"
          >
            <Plus className="w-4 h-4" />
            Create New Course
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)] gap-6">

          {/* Sidebar */}
          <aside className="bg-white border border-gray-200 rounded-2xl p-3 h-fit">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">
              Workspace
            </p>

            <nav className="flex lg:flex-col gap-2 overflow-x-auto">
              {NAV_ITEMS.map(
                ({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveSection(id)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-colors text-left ${
                      activeSection === id
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5 shrink-0" />
                    {label}

                    {activeSection === id && (
                      <ChevronRight className="w-4 h-4 ml-auto hidden lg:block" />
                    )}
                  </button>
                )
              )}
            </nav>

            <div className="hidden lg:block border-t border-gray-100 mt-4 pt-4 px-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                  {(user?.name || 'I')
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.name || 'Instructor'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Instructor account
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0">

            {/* Overview */}
            {activeSection === 'overview' && (
              <div>
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-7">
                  {[
                    {
                      label: 'Total Courses',
                      value: courses.length,
                      icon: BookOpen,
                      color: 'bg-indigo-50 text-indigo-600',
                    },
                    {
                      label: 'Total Students',
                      value: totalStudents.toLocaleString(),
                      icon: Users,
                      color: 'bg-blue-50 text-blue-600',
                    },
                    {
                      label: 'Published',
                      value: publishedCourses,
                      icon: CheckCircle,
                      color: 'bg-green-50 text-green-600',
                    },
                    {
                      label: 'Average Rating',
                      value: averageRating,
                      icon: Star,
                      color: 'bg-amber-50 text-amber-600',
                    },
                  ].map(
                    ({ label, value, icon: Icon, color }) => (
                      <div
                        key={label}
                        className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5"
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>

                        <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-4">
                          {value}
                        </p>

                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          {label}
                        </p>
                      </div>
                    )
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 mb-6">
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        Recent Courses
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Your recently created and managed courses.
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveSection('courses')}
                      className="text-sm text-indigo-600 font-semibold hover:text-indigo-800 whitespace-nowrap"
                    >
                      View all
                    </button>
                  </div>

                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((item) => (
                        <div
                          key={item}
                          className="h-24 bg-gray-100 rounded-xl animate-pulse"
                        />
                      ))}
                    </div>
                  ) : courses.length === 0 ? (
                    <div className="text-center py-10">
                      <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="font-semibold text-gray-800">
                        No courses yet
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 mb-4">
                        Create your first course to get started.
                      </p>
                      <button
                        onClick={openCreateForm}
                        className="btn-primary inline-flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Create Course
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {courses
                        .slice(0, 4)
                        .map(renderCourseCard)}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                        <Video className="w-5 h-5 text-indigo-600" />
                      </div>
                      <h3 className="font-bold text-gray-900">
                        Manage your lessons
                      </h3>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">
                      Add video lessons and learning materials to your courses.
                    </p>

                    <button
                      onClick={() => setActiveSection('lessons')}
                      className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                    >
                      Manage Lessons →
                    </button>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-amber-600" />
                      </div>
                      <h3 className="font-bold text-gray-900">
                        Grow your courses
                      </h3>
                    </div>

                    <p className="text-sm text-gray-600">
                      Keep your content updated, respond to reviews, and help
                      your students learn more effectively.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* My Courses */}
            {activeSection === 'courses' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      My Courses
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Create, edit, preview, and manage your courses.
                    </p>
                  </div>

                  <button
                    onClick={openCreateForm}
                    className="btn-primary flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    New Course
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) =>
                          setSearchTerm(e.target.value)
                        }
                        placeholder="Search your courses..."
                        className="input-field pl-9"
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(e.target.value)
                      }
                      className="input-field sm:w-44"
                    >
                      <option value="all">All Courses</option>
                      <option value="published">Published</option>
                      <option value="draft">Drafts</option>
                    </select>
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="h-28 bg-white border border-gray-200 rounded-2xl animate-pulse"
                      />
                    ))}
                  </div>
                ) : filteredCourses.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
                    <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />

                    <h3 className="font-semibold text-gray-800">
                      {courses.length === 0
                        ? 'You have not created any courses'
                        : 'No matching courses found'}
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      {courses.length === 0
                        ? 'Create your first course to get started.'
                        : 'Try changing your search or status filter.'}
                    </p>

                    {courses.length === 0 && (
                      <button
                        onClick={openCreateForm}
                        className="btn-primary mt-4"
                      >
                        Create Course
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredCourses.map(renderCourseCard)}
                  </div>
                )}
              </div>
            )}

            {/* Lessons and Videos */}
            {activeSection === 'lessons' && (
              <div>
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-gray-900">
                    Lessons & Videos
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Select a course to add or manage its lessons.
                  </p>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="h-24 bg-white border border-gray-200 rounded-2xl animate-pulse"
                      />
                    ))}
                  </div>
                ) : courses.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
                    <BookMarked className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-800">
                      Create a course first
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 mb-4">
                      You need a course before adding lessons.
                    </p>
                    <button
                      onClick={openCreateForm}
                      className="btn-primary"
                    >
                      Create Course
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courses.map((course) => (
                      <div
                        key={course.id}
                        className="bg-white border border-gray-200 rounded-2xl p-4"
                      >
                        <div className="flex gap-3 items-center mb-4">
                          <img
                            src={
                              course.thumbnail ||
                              course.imageUrl ||
                              course.image_url ||
                              'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&auto=format'
                            }
                            alt={course.title}
                            className="w-16 h-16 object-cover rounded-xl"
                            onError={(e) => {
                              e.currentTarget.src =
                                'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&auto=format';
                            }}
                          />

                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 line-clamp-2">
                              {course.title}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                              {course.category || 'Uncategorized'}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => openLessons(course)}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                        >
                          <Video className="w-4 h-4" />
                          Manage Lessons
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* My Students */}
            {activeSection === 'students' && (
              <InstructorStudents />
            )}

          </main>
        </div>
      </div>

      {/* Create/Edit Course Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingCourse
                    ? 'Edit Course'
                    : 'Create New Course'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Enter the details of your course.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Title *
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. Complete React Developer"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short Description
                </label>
                <textarea
                  name="shortDescription"
                  value={form.shortDescription}
                  onChange={handleFormChange}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Brief overview of your course"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    name="price"
                    type="number"
                    value={form.price}
                    onChange={handleFormChange}
                    required
                    min="0"
                    className="input-field"
                    placeholder="e.g. 999"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Level
                  </label>
                  <select
                    name="level"
                    value={form.level}
                    onChange={handleFormChange}
                    className="input-field"
                  >
                    {[
                      'Beginner',
                      'Intermediate',
                      'Advanced',
                    ].map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleFormChange}
                  className="input-field"
                >
                  {[
                    'Web Development',
                    'Python',
                    'JavaScript',
                    'Node.js',
                    'Data Science',
                    'UI/UX Design',
                    'Artificial Intelligence',
                    'DevOps',
                    'Design',
                  ].map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thumbnail URL
                </label>
                <input
                  name="thumbnail"
                  value={form.thumbnail}
                  onChange={handleFormChange}
                  placeholder="https://..."
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Status
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleFormChange}
                  className="input-field"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1 disabled:opacity-60"
                >
                  {submitting
                    ? 'Saving...'
                    : editingCourse
                      ? 'Save Changes'
                      : 'Create Course'}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Lessons Modal */}
      {selectedCourse && (
        <ManageLessons
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
        />
      )}
    </div>
  );
};

export default InstructorDashboard;

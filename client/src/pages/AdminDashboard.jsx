
import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  BookOpen,
  DollarSign,
  Shield,
  AlertCircle,
  Star,
  UserCheck,
  Tag,
  RefreshCw
} from 'lucide-react';

import api from '../services/api';
import courseService from '../services/courseService';
import { formatPrice } from '../utils/helpers';
import { toast } from '../utils/toast';
import { useScrollToTop } from '../hooks/useCustomHooks';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className={`card p-5 border-l-4 ${color}`}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-gray-500">{label}</span>
      <Icon className="w-5 h-5 text-gray-400" />
    </div>
    <div className="text-2xl font-bold text-gray-900">{value}</div>
  </div>
);

const EmptyState = ({ message }) => (
  <div className="card p-8 text-center text-gray-500">
    {message}
  </div>
);

const AdminDashboard = () => {
  useScrollToTop();

  const [tab, setTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [dashboardResponse, courseResponse] = await Promise.all([
        api.get('/admin/dashboard'),
        courseService.getAll({ limit: 100 })
      ]);

      const responseData = dashboardResponse.data;
      const dashboardData = responseData.dashboard || responseData;

      setDashboard(dashboardData);

      setCourses(
        Array.isArray(dashboardData.courses)
          ? dashboardData.courses
          : Array.isArray(courseResponse.courses)
            ? courseResponse.courses
            : []
      );
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Unable to load dashboard data.';

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const overview = dashboard?.overview || {};
  const enrollments = Array.isArray(dashboard?.monthlyEnrollments)
    ? dashboard.monthlyEnrollments
    : [];

  const users = Array.isArray(dashboard?.recentUsers)
    ? dashboard.recentUsers
    : [];

  const reviews = Array.isArray(dashboard?.reviews)
    ? dashboard.reviews
    : [];

  const coupons = Array.isArray(dashboard?.coupons)
    ? dashboard.coupons
    : [];

  const number = (value) =>
    value == null ? '—' : Number(value).toLocaleString();

  const totalStudents = overview.totalStudents;
  const totalInstructors = overview.totalInstructors;
  const totalCourses = overview.totalCourses ?? courses.length;
  const totalRevenue = overview.totalRevenue;

  const handleDeleteCourse = async (course) => {
    if (
      !window.confirm(
        `Delete "${course.title}"? This action may be permanent.`
      )
    ) {
      return;
    }

    try {
      await courseService.remove(course.id);
      toast.success('Course deleted.');
      await loadDashboard();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        err.message ||
        'Unable to delete course.'
      );
    }
  };

  const tabs = ['overview', 'courses', 'users', 'reviews', 'coupons'];

  return (
    <div className="page-container py-10">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <Shield className="w-7 h-7 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
        </div>

        <button
          onClick={loadDashboard}
          disabled={loading}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <RefreshCw
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
          />
          Refresh
        </button>
      </div>

      <p className="text-gray-500 text-sm mb-6">
        Platform management — connected database statistics
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex gap-3 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">
              Dashboard data could not be loaded.
            </p>
            <p>{error}</p>
            <p className="mt-1">
              Check your login session, backend logs and admin permissions.
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto mb-8 border-b border-gray-200">
        {tabs.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`capitalize px-4 py-2 text-sm font-semibold border-b-2 shrink-0 ${
              tab === item
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {loading && !dashboard ? (
        <div className="card p-8 text-center text-gray-500">
          Loading dashboard data from the backend...
        </div>
      ) : (
        <>
          {tab === 'overview' && (
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                  icon={Users}
                  label="Total Students"
                  value={number(totalStudents)}
                  color="border-blue-500"
                />

                <StatCard
                  icon={UserCheck}
                  label="Instructors"
                  value={number(totalInstructors)}
                  color="border-purple-500"
                />

                <StatCard
                  icon={BookOpen}
                  label="Total Courses"
                  value={number(totalCourses)}
                  color="border-indigo-500"
                />

                <StatCard
                  icon={DollarSign}
                  label="Total Revenue"
                  value={
                    totalRevenue == null
                      ? 'Not available'
                      : formatPrice(totalRevenue)
                  }
                  color="border-green-500"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="card p-6">
                  <h3 className="font-bold text-gray-900 mb-2">
                    Monthly Enrollments
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Actual enrollment records grouped by month
                  </p>

                  {enrollments.length === 0 ? (
                    <p className="text-sm text-gray-500 py-8 text-center">
                      No enrollment chart data is available yet.
                    </p>
                  ) : (
                    <div className="flex items-end gap-2 h-40">
                      {enrollments.map((item, index) => {
                        const value = Number(item.enrollments || 0);
                        const max = Math.max(
                          1,
                          ...enrollments.map((entry) =>
                            Number(entry.enrollments || 0)
                          )
                        );

                        return (
                          <div
                            key={item.month || index}
                            className="flex-1 h-full flex flex-col justify-end items-center min-w-0"
                          >
                            <div
                              className="w-full bg-indigo-500 rounded-t"
                              style={{
                                height: `${(value / max) * 100}%`,
                                minHeight: value > 0 ? '3px' : '0'
                              }}
                              title={`${item.month}: ${number(value)}`}
                            />
                            <span className="text-xs text-gray-400 mt-2 truncate w-full text-center">
                              {item.month}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="card p-6">
                  <h3 className="font-bold text-gray-900 mb-2">
                    Monthly Revenue
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Actual payment transactions only
                  </p>

                  <div className="py-8 text-center text-gray-500 text-sm">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    Revenue reporting requires actual payment transaction
                    records. Estimated revenue is not shown.
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-bold text-gray-900 mb-4">
                  Top Performing Courses
                </h3>

                {courses.length === 0 ? (
                  <EmptyState message="No courses found in the database." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-gray-500 border-b">
                        <tr>
                          <th className="pb-3">Course</th>
                          <th className="pb-3">Students</th>
                          <th className="pb-3">Rating</th>
                          <th className="pb-3">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {[...courses]
                          .sort(
                            (a, b) =>
                              Number(b.enrolledStudents || 0) -
                              Number(a.enrolledStudents || 0)
                          )
                          .slice(0, 5)
                          .map((course) => (
                            <tr key={course.id}>
                              <td className="py-3 font-medium">
                                {course.title}
                              </td>
                              <td className="py-3">
                                {number(course.enrolledStudents)}
                              </td>
                              <td className="py-3">
                                <span className="inline-flex items-center gap-1">
                                  <Star className="w-4 h-4 text-amber-500" />
                                  {Number(course.rating || 0).toFixed(1)}
                                </span>
                              </td>
                              <td className="py-3">
                                {formatPrice(course.price || 0)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'courses' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Course Management</h2>

              {courses.length === 0 ? (
                <EmptyState message="No courses found." />
              ) : (
                <div className="card overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left">
                      <tr>
                        <th className="p-4">Course</th>
                        <th className="p-4">Instructor</th>
                        <th className="p-4">Students</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {courses.map((course) => (
                        <tr key={course.id}>
                          <td className="p-4 font-medium">
                            {course.title}
                          </td>
                          <td className="p-4">
                            {course.instructor || '—'}
                          </td>
                          <td className="p-4">
                            {number(course.enrolledStudents)}
                          </td>
                          <td className="p-4">
                            {formatPrice(course.price || 0)}
                          </td>
                          <td className="p-4 capitalize">
                            {course.status || 'unknown'}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleDeleteCourse(course)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'users' && (
            <div>
              <h2 className="text-xl font-bold mb-4">User Management</h2>

              {users.length === 0 ? (
                <EmptyState message="No real user records are available from the backend yet." />
              ) : (
                <div className="card overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left">
                      <tr>
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="p-4">
                            {user.name || user.full_name || '—'}
                          </td>
                          <td className="p-4">{user.email || '—'}</td>
                          <td className="p-4 capitalize">
                            {user.role || '—'}
                          </td>
                          <td className="p-4">
                            {user.joinedAt || user.created_at
                              ? new Date(
                                  user.joinedAt || user.created_at
                                ).toLocaleDateString()
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'reviews' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Review Moderation</h2>

              {reviews.length === 0 ? (
                <EmptyState message="No real review records are available from the backend yet." />
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="card p-5">
                      <div className="font-semibold">
                        {review.user || review.user_name || 'User'}
                        {' — '}
                        {review.course || review.course_title || 'Course'}
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        {review.content || review.comment || ''}
                      </div>
                      <div className="text-sm mt-2">
                        Rating: {review.rating ?? '—'} · Status:{' '}
                        {review.status || '—'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'coupons' && (
            <div>
              <h2 className="text-xl font-bold mb-4">
                Coupon Management
              </h2>

              <div className="card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Tag className="w-6 h-6 text-indigo-600" />
                  <h3 className="font-semibold text-gray-900">
                    Coupons
                  </h3>
                </div>

                {coupons.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No coupons found. A Supabase coupons table and backend
                    support are required before real coupons can appear here.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-left">
                        <tr>
                          <th className="p-4">Code</th>
                          <th className="p-4">Discount</th>
                          <th className="p-4">Uses</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {coupons.map((coupon) => (
                          <tr key={coupon.id || coupon.code}>
                            <td className="p-4 font-semibold">
                              {coupon.code}
                            </td>
                            <td className="p-4">
                              {coupon.discount ??
                                coupon.discount_percentage ??
                                '—'}
                            </td>
                            <td className="p-4">
                              {number(
                                coupon.uses ?? coupon.usage_count ?? 0
                              )}
                            </td>
                            <td className="p-4">
                              {coupon.active ? 'Active' : 'Inactive'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;

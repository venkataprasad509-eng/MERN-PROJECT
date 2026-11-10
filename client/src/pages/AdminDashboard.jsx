
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

  // Coupon states
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponSubmitting, setCouponSubmitting] = useState(false);

  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    expiresAt: '',
    maxUses: '',
    newStudentsOnly: false
  });

  // Load dashboard
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

  // Load coupons
  const loadCoupons = useCallback(async () => {
    setCouponsLoading(true);

    try {
      const response = await api.get('/admin/coupons');

      setCoupons(
        Array.isArray(response.data.coupons)
          ? response.data.coupons
          : []
      );
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Unable to load coupons.';

      toast.error(message);
    } finally {
      setCouponsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'coupons') {
      loadCoupons();
    }
  }, [tab, loadCoupons]);

  // Create coupon
  const handleCreateCoupon = async (e) => {
    e.preventDefault();

    const code = couponForm.code.trim().toUpperCase();
    const discountValue = Number(couponForm.discountValue);
    const maxUses = couponForm.maxUses
      ? Number(couponForm.maxUses)
      : null;

    if (!code) {
      toast.error('Please enter a coupon code.');
      return;
    }

    if (
      !Number.isFinite(discountValue) ||
      discountValue <= 0 ||
      (couponForm.discountType === 'percentage' &&
        discountValue > 100)
    ) {
      toast.error('Please enter a valid discount value.');
      return;
    }

    if (
      maxUses !== null &&
      (!Number.isInteger(maxUses) || maxUses <= 0)
    ) {
      toast.error('Maximum uses must be a positive whole number.');
      return;
    }

    const payload = {
      code,
      discountType: couponForm.discountType,
      discountValue,
      newStudentsOnly: couponForm.newStudentsOnly,
      maxUses,
      expiresAt: couponForm.expiresAt
        ? new Date(couponForm.expiresAt).toISOString()
        : null
    };

    if (
      couponForm.expiresAt &&
      new Date(couponForm.expiresAt) <= new Date()
    ) {
      toast.error('Expiry date must be in the future.');
      return;
    }

    setCouponSubmitting(true);

    try {
      const response = await api.post('/admin/coupons', payload);

      toast.success(
        response.data.message || 'Coupon created successfully.'
      );

      setCouponForm({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        expiresAt: '',
        maxUses: '',
        newStudentsOnly: false
      });

      await loadCoupons();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        err.message ||
        'Unable to create coupon.'
      );
    } finally {
      setCouponSubmitting(false);
    }
  };

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

  const number = (value) =>
    value == null ? '—' : Number(value).toLocaleString();

  const totalStudents = overview.totalStudents;
  const totalInstructors = overview.totalInstructors;
  const totalCourses = overview.totalCourses ?? courses.length;
  const totalRevenue = overview.totalRevenue;

  // Delete course
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

  const tabs = [
    'overview',
    'courses',
    'users',
    'reviews',
    'coupons'
  ];

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
          {/* OVERVIEW */}
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

          {/* COURSES */}
          {tab === 'courses' && (
            <div>
              <h2 className="text-xl font-bold mb-4">
                Course Management
              </h2>

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

          {/* USERS */}
          {tab === 'users' && (
            <div>
              <h2 className="text-xl font-bold mb-4">
                User Management
              </h2>

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

                          <td className="p-4">
                            {user.email || '—'}
                          </td>

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

          {/* REVIEWS */}
          {tab === 'reviews' && (
            <div>
              <h2 className="text-xl font-bold mb-4">
                Review Moderation
              </h2>

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

          {/* COUPONS */}
          {tab === 'coupons' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Tag className="w-6 h-6 text-indigo-600" />

                <h2 className="text-xl font-bold">
                  Coupon Management
                </h2>
              </div>

              {/* Create Coupon */}
              <div className="card p-6 mb-8">
                <h3 className="font-semibold text-lg mb-5">
                  Create New Coupon
                </h3>

                <form onSubmit={handleCreateCoupon}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Coupon Code
                      </label>

                      <input
                        type="text"
                        placeholder="Example: WELCOME20"
                        value={couponForm.code}
                        onChange={(e) =>
                          setCouponForm({
                            ...couponForm,
                            code: e.target.value.toUpperCase()
                          })
                        }
                        maxLength={30}
                        required
                        className="input w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Discount Type
                      </label>

                      <select
                        value={couponForm.discountType}
                        onChange={(e) =>
                          setCouponForm({
                            ...couponForm,
                            discountType: e.target.value
                          })
                        }
                        className="input w-full"
                      >
                        <option value="percentage">
                          Percentage (%)
                        </option>

                        <option value="fixed">
                          Fixed Amount (₹)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Discount Value
                      </label>

                      <input
                        type="number"
                        min="0.01"
                        max={
                          couponForm.discountType === 'percentage'
                            ? 100
                            : undefined
                        }
                        step="0.01"
                        placeholder={
                          couponForm.discountType === 'percentage'
                            ? 'Example: 20'
                            : 'Example: 200'
                        }
                        value={couponForm.discountValue}
                        onChange={(e) =>
                          setCouponForm({
                            ...couponForm,
                            discountValue: e.target.value
                          })
                        }
                        required
                        className="input w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Expiry Date (Optional)
                      </label>

                      <input
                        type="datetime-local"
                        value={couponForm.expiresAt}
                        onChange={(e) =>
                          setCouponForm({
                            ...couponForm,
                            expiresAt: e.target.value
                          })
                        }
                        className="input w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Maximum Uses (Optional)
                      </label>

                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Leave empty for unlimited"
                        value={couponForm.maxUses}
                        onChange={(e) =>
                          setCouponForm({
                            ...couponForm,
                            maxUses: e.target.value
                          })
                        }
                        className="input w-full"
                      />
                    </div>

                  </div>

                  <div className="mt-5">
                    <label className="flex items-center gap-3 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={couponForm.newStudentsOnly}
                        onChange={(e) =>
                          setCouponForm({
                            ...couponForm,
                            newStudentsOnly: e.target.checked
                          })
                        }
                        className="w-4 h-4"
                      />

                      Only students who have never purchased a course
                      can use this coupon.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={couponSubmitting}
                    className="btn-primary mt-6 disabled:opacity-50"
                  >
                    {couponSubmitting
                      ? 'Creating Coupon...'
                      : 'Create Coupon'}
                  </button>
                </form>
              </div>

              {/* Existing Coupons */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-lg">
                    Existing Coupons
                  </h3>

                  <button
                    onClick={loadCoupons}
                    disabled={couponsLoading}
                    className="flex items-center gap-2 text-sm text-indigo-600"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${
                        couponsLoading ? 'animate-spin' : ''
                      }`}
                    />

                    Refresh
                  </button>
                </div>

                {couponsLoading ? (
                  <p className="text-center text-gray-500 py-6">
                    Loading coupons...
                  </p>
                ) : coupons.length === 0 ? (
                  <EmptyState message="No coupons created yet. Create your first coupon above." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-left">
                        <tr>
                          <th className="p-4">Code</th>
                          <th className="p-4">Discount</th>
                          <th className="p-4">Uses</th>
                          <th className="p-4">Expiry</th>
                          <th className="p-4">Eligibility</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y">
                        {coupons.map((coupon) => {
                          const expired =
                            coupon.expires_at &&
                            new Date(coupon.expires_at) < new Date();

                          const limitReached =
                            coupon.max_uses != null &&
                            Number(coupon.usage_count || 0) >=
                              Number(coupon.max_uses);

                          const active =
                            coupon.is_active &&
                            !expired &&
                            !limitReached;

                          return (
                            <tr key={coupon.id}>
                              <td className="p-4 font-bold">
                                {coupon.code}
                              </td>

                              <td className="p-4">
                                {coupon.discount_type === 'percentage'
                                  ? `${coupon.discount_value}%`
                                  : formatPrice(coupon.discount_value)}
                              </td>

                              <td className="p-4">
                                {number(coupon.usage_count || 0)}
                                {' / '}
                                {coupon.max_uses ?? 'Unlimited'}
                              </td>

                              <td className="p-4">
                                {coupon.expires_at
                                  ? new Date(
                                      coupon.expires_at
                                    ).toLocaleDateString()
                                  : 'No expiry'}
                              </td>

                              <td className="p-4">
                                {coupon.new_students_only
                                  ? 'New students'
                                  : 'All students'}
                              </td>

                              <td className="p-4">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    active
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
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

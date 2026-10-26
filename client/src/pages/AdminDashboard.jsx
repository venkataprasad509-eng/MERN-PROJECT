import { useState, useEffect } from 'react';
import {
  Users, BookOpen, DollarSign, TrendingUp, Star, Shield, AlertCircle,
  CheckCircle, XCircle, UserCheck, Tag
} from 'lucide-react';
import courseService from '../services/courseService';
import { formatPrice } from '../utils/helpers';
import { toast } from '../utils/toast';
import { useScrollToTop } from '../hooks/useCustomHooks';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ENROLLMENTS = [820, 940, 1100, 1380, 1250, 1620, 1480, 1890, 2100, 1980, 2350, 2180];
const REVENUE = [182000, 241000, 195000, 320000, 285000, 410000, 380000, 452000, 521000, 490000, 612000, 580000];
const MAX_ENR = Math.max(...ENROLLMENTS);
const MAX_REV = Math.max(...REVENUE);

const MOCK_USERS = [
  { id: 'u1', name: 'Aditya Kumar', email: 'aditya@example.com', role: 'student', courses: 5, joined: 'Sep 2024', status: 'active' },
  { id: 'u2', name: 'Priya Sharma', email: 'priya@example.com', role: 'instructor', courses: 3, joined: 'Aug 2024', status: 'active' },
  { id: 'u3', name: 'Rohit Verma', email: 'rohit@example.com', role: 'student', courses: 2, joined: 'Oct 2024', status: 'active' },
  { id: 'u4', name: 'Sneha Patel', email: 'sneha@example.com', role: 'student', courses: 8, joined: 'Jul 2024', status: 'active' },
  { id: 'u5', name: 'Vikram Singh', email: 'vikram@example.com', role: 'instructor', courses: 7, joined: 'Jun 2024', status: 'active' },
];

const MOCK_REVIEWS = [
  { id: 'r1', user: 'Ananya R.', course: 'React Complete Guide', rating: 5, content: 'Amazing course, loved every lesson!', status: 'approved' },
  { id: 'r2', user: 'Karan M.', course: 'Python Masterclass', rating: 2, content: 'Too slow-paced for me.', status: 'pending' },
  { id: 'r3', user: 'Divya T.', course: 'Node.js Expert', rating: 4, content: 'Very practical and hands-on.', status: 'approved' },
];

const MOCK_COUPONS = [
  { code: 'SAVE10', discount: '10%', uses: 142, active: true },
  { code: 'FLAT500', discount: '₹500 off', uses: 98, active: true },
  { code: 'WELCOME20', discount: '20%', uses: 312, active: true },
];

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className={`card p-5 border-l-4 ${color}`}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-gray-500">{label}</span>
      <Icon className="w-5 h-5 text-gray-400" />
    </div>
    <div className="text-2xl font-bold text-gray-900">{value}</div>
    {sub && <div className="text-xs text-green-600 mt-1">{sub}</div>}
  </div>
);

const AdminDashboard = () => {
  useScrollToTop();
  const [courses, setCourses] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courseService.getAll({ limit: 50 })
      .then((d) => setCourses(d.courses || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Delete this course? (Demo only)')) return;
    try {
      await courseService.remove(id);
      setCourses((prev) => prev.filter((c) => c.id !== id));
      toast.success('Course deleted (demo)');
    } catch (err) { toast.error(err.message); }
  };

  const TABS = ['overview', 'courses', 'users', 'reviews', 'coupons'];

  return (
    <div className="page-container py-10">
      <div className="flex items-center gap-3 mb-2">
        <Shield className="w-7 h-7 text-indigo-600" />
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>
      <p className="text-gray-500 text-sm mb-6">Platform management — demo data only</p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3 items-start text-sm text-amber-800">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <span><strong>DEV MODE:</strong> All admin actions operate on demo data. No real users, payments, or moderation actions occur.</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto mb-8 border-b border-gray-200 pb-0">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`capitalize px-4 py-2 text-sm font-semibold border-b-2 transition-colors shrink-0 ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Users} label="Total Students" value="8,450" color="border-blue-500" sub="+12% this month" />
            <StatCard icon={UserCheck} label="Instructors" value="127" color="border-purple-500" sub="+3 this week" />
            <StatCard icon={BookOpen} label="Total Courses" value={courses.length || 12} color="border-indigo-500" sub="3 pending review" />
            <StatCard icon={DollarSign} label="Total Revenue" value="₹48.6L" color="border-green-500" sub="+18% vs last month" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4">Monthly Enrollments</h3>
              <div className="flex items-end gap-1 h-36 mb-2">
                {ENROLLMENTS.map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-indigo-500 hover:bg-indigo-600 rounded-t transition-colors"
                      style={{ height: `${(v / MAX_ENR) * 100}%` }}
                      title={`${MONTHS[i]}: ${v.toLocaleString()} enrollments`} />
                  </div>
                ))}
              </div>
              <div className="flex gap-1">{MONTHS.map((m) => <div key={m} className="flex-1 text-center text-xs text-gray-400">{m.slice(0, 1)}</div>)}</div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4">Monthly Revenue (₹)</h3>
              <div className="flex items-end gap-1 h-36 mb-2">
                {REVENUE.map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-green-500 hover:bg-green-600 rounded-t transition-colors"
                      style={{ height: `${(v / MAX_REV) * 100}%` }}
                      title={`${MONTHS[i]}: ${formatPrice(v)}`} />
                  </div>
                ))}
              </div>
              <div className="flex gap-1">{MONTHS.map((m) => <div key={m} className="flex-1 text-center text-xs text-gray-400">{m.slice(0, 1)}</div>)}</div>
            </div>
          </div>

          {/* Top courses */}
          <div className="card p-6 mt-6">
            <h3 className="font-bold text-gray-900 mb-4">Top Performing Courses</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="pb-3 font-medium">Course</th>
                    <th className="pb-3 font-medium">Students</th>
                    <th className="pb-3 font-medium">Rating</th>
                    <th className="pb-3 font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {courses.slice(0, 5).map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-800 max-w-xs truncate">{c.title}</td>
                      <td className="py-3 text-gray-600">{c.enrolledStudents?.toLocaleString()}</td>
                      <td className="py-3 text-amber-600 font-semibold">⭐ {c.rating}</td>
                      <td className="py-3 text-green-700 font-semibold">{formatPrice(c.price * Math.floor((c.enrolledStudents || 0) * 0.01))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Courses tab */}
      {tab === 'courses' && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Course Management</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-left">
                <tr>
                  <th className="p-4 font-medium text-gray-600">Course</th>
                  <th className="p-4 font-medium text-gray-600">Instructor</th>
                  <th className="p-4 font-medium text-gray-600">Students</th>
                  <th className="p-4 font-medium text-gray-600">Price</th>
                  <th className="p-4 font-medium text-gray-600">Status</th>
                  <th className="p-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={6} className="p-6 text-center text-gray-400">Loading...</td></tr>
                ) : courses.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800 max-w-xs">
                      <div className="flex items-center gap-3">
                        <img src={c.thumbnail} alt="" className="w-10 h-7 object-cover rounded shrink-0"
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&auto=format'; }} />
                        <span className="line-clamp-1">{c.title}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{c.instructor}</td>
                    <td className="p-4 text-gray-600">{c.enrolledStudents?.toLocaleString()}</td>
                    <td className="p-4 font-semibold text-indigo-700">{formatPrice(c.price)}</td>
                    <td className="p-4"><span className={`badge capitalize ${c.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.status || 'published'}</span></td>
                    <td className="p-4">
                      <button onClick={() => handleDeleteCourse(c.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users tab */}
      {tab === 'users' && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">User Management</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-left">
                <tr>
                  <th className="p-4 font-medium text-gray-600">Name</th>
                  <th className="p-4 font-medium text-gray-600">Email</th>
                  <th className="p-4 font-medium text-gray-600">Role</th>
                  <th className="p-4 font-medium text-gray-600">Courses</th>
                  <th className="p-4 font-medium text-gray-600">Joined</th>
                  <th className="p-4 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {MOCK_USERS.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800">{u.name}</td>
                    <td className="p-4 text-gray-500">{u.email}</td>
                    <td className="p-4 capitalize"><span className={`badge ${u.role === 'instructor' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span></td>
                    <td className="p-4 text-gray-600">{u.courses}</td>
                    <td className="p-4 text-gray-500">{u.joined}</td>
                    <td className="p-4"><span className="badge bg-green-100 text-green-700">{u.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reviews tab */}
      {tab === 'reviews' && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Review Moderation</h2>
          <div className="space-y-4">
            {MOCK_REVIEWS.map((r) => (
              <div key={r.id} className="card p-5 flex gap-4 items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-900">{r.user}</span>
                    <span className="text-xs text-gray-500">on</span>
                    <span className="text-xs font-medium text-indigo-600">{r.course}</span>
                    <div className="flex ml-2">{[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />)}</div>
                  </div>
                  <p className="text-sm text-gray-600">"{r.content}"</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`badge ${r.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{r.status}</span>
                  {r.status === 'pending' && (
                    <>
                      <button onClick={() => toast.success('Review approved (demo)')} className="p-1.5 text-green-600 hover:bg-green-50 rounded"><CheckCircle className="w-4 h-4" /></button>
                      <button onClick={() => toast.info('Review rejected (demo)')} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><XCircle className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coupons tab */}
      {tab === 'coupons' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Coupon Management</h2>
            <button onClick={() => toast.info('Coupon creation UI coming soon (demo)')} className="btn-primary text-sm flex items-center gap-2">
              <Tag className="w-4 h-4" /> New Coupon
            </button>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b text-left">
                <tr>
                  <th className="p-4 font-medium text-gray-600">Code</th>
                  <th className="p-4 font-medium text-gray-600">Discount</th>
                  <th className="p-4 font-medium text-gray-600">Total Uses</th>
                  <th className="p-4 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {MOCK_COUPONS.map((c) => (
                  <tr key={c.code} className="hover:bg-gray-50">
                    <td className="p-4 font-mono font-bold text-indigo-700">{c.code}</td>
                    <td className="p-4 text-gray-700">{c.discount}</td>
                    <td className="p-4 text-gray-600">{c.uses}</td>
                    <td className="p-4"><span className="badge bg-green-100 text-green-700">Active</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

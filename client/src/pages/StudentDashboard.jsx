import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  Settings,
  Bell,
  Search,
  Play,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Award,
} from 'lucide-react';
import enrollmentService from '../services/enrollmentService';
import { useAuth } from '../context/AuthContext';
import { useScrollToTop } from '../hooks/useCustomHooks';

const StudentDashboard = () => {
  useScrollToTop();
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [activeNav, setActiveNav] = useState('Overview');

  useEffect(() => {
    let isMounted = true;
    const fetchEnrollments = async () => {
      setLoading(true);
      try {
        const res = await enrollmentService.getMyEnrollments();
        if (isMounted) {
          setEnrollments(res?.enrollments || []);
        }
      } catch (err) {
        console.error('Failed to load enrollments:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchEnrollments();
    return () => { isMounted = false; };
  }, []);

  const totalCourses = enrollments.length;
  const completedCount = enrollments.filter(e => Number(e.progress || 0) >= 100).length;
  const inProgressCount = enrollments.filter(e => Number(e.progress || 0) > 0 && Number(e.progress || 0) < 100).length;
  const upcomingCount = enrollments.filter(e => Number(e.progress || 0) === 0).length;

  const avgProgress = totalCourses > 0
    ? Math.round(enrollments.reduce((acc, curr) => acc + (Number(curr.progress) || 0), 0) / totalCourses)
    : 0;

  // Real user display values from authenticated profile
  const firstName = user?.name ? user.name.split(' ')[0] : (user?.email ? user.email.split('@')[0] : 'Student');
  const fullName = user?.name || user?.email?.split('@')[0] || 'Student';
  const roleTitle = user?.role === 'instructor' ? 'Instructor' : 'Enrolled Student';

  // Dynamic learning activity derived from actual course progress
  const activeHours = Math.max(0.5, (totalCourses * 1.5) + (completedCount * 3)).toFixed(1);
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const todayDate = new Date().getDate();

  // Filter courses based on activeTab
  const filteredCourses = enrollments.filter(e => {
    const p = Number(e.progress || 0);
    if (activeTab === 'In Progress') return p > 0 && p < 100;
    if (activeTab === 'Completed') return p >= 100;
    return true;
  });

  return (
    <div className="bg-[#f8f9fd] min-h-screen py-6 px-4 md:px-8">
      <div className="max-w-[1400px] mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col lg:flex-row overflow-hidden min-h-[860px]">
        
        {/* ── Left Sidebar ────────────────────────── */}
        <aside className="w-full lg:w-64 bg-white border-r border-gray-100 p-6 flex flex-col justify-between shrink-0">
          <div>
            {/* Brand Logo */}
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl text-gray-900 tracking-tight">LumiLearn</span>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1.5">
              {[
                { name: 'Overview', icon: LayoutDashboard },
                { name: 'My Learning', icon: BookOpen, path: '/my-courses' },
                { name: 'Courses', icon: Layers, path: '/courses' },
                { name: 'Settings', icon: Settings, path: '/profile' },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.name;
                const buttonContent = (
                  <>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                    <span className="flex-1 font-medium text-sm">{item.name}</span>
                  </>
                );

                if (item.path) {
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setActiveNav(item.name)}
                      className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all group ${
                        isActive ? 'bg-indigo-50/80 text-indigo-600 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {buttonContent}
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setActiveNav(item.name)}
                    className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all text-left group ${
                      isActive ? 'bg-indigo-50/80 text-indigo-600 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {buttonContent}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Go Premium Card */}
          <div className="mt-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-50/40 p-4 rounded-2xl border border-indigo-100/60 text-center relative overflow-hidden">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm mx-auto flex items-center justify-center mb-2.5">
              <Award className="w-6 h-6 text-indigo-600" />
            </div>
            <h4 className="font-bold text-gray-900 text-sm">Course Access</h4>
            <p className="text-xs text-gray-500 mt-1 mb-3">Enrolled courses include verified completion certificates.</p>
            <Link to="/courses" className="block w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm">
              Explore More Courses
            </Link>
          </div>
        </aside>

        {/* ── Main Content Area ──────────────────────────────────────── */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* Header Row: Greeting & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                Good day, {firstName}! 👋
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">Track your progress and continue learning.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-64 md:w-72">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search your courses..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 hover:bg-gray-100/80 focus:bg-white text-xs rounded-xl border border-gray-200/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
              <button className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors relative">
                <Bell className="w-4 h-4" />
              </button>
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`}
                alt={fullName}
                className="w-9 h-9 rounded-xl object-cover border border-indigo-100"
              />
            </div>
          </div>

          {/* Top Activity & Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Learning Activity Stats */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-sm">Your Learning Summary</h3>
                  <span className="text-xs text-indigo-700 bg-indigo-50 font-semibold px-2 py-0.5 rounded-lg">
                    Real-time
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-extrabold text-gray-900">{totalCourses}</span>
                  <span className="text-xs text-gray-500">Active enrollments</span>
                  {totalCourses > 0 && (
                    <span className="ml-auto text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" /> In progress
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
                <div className="p-3 bg-gray-50/80 rounded-xl">
                  <span className="text-xs text-gray-500 block">Avg Progress</span>
                  <span className="text-xl font-bold text-indigo-600">{avgProgress}%</span>
                </div>
                <div className="p-3 bg-gray-50/80 rounded-xl">
                  <span className="text-xs text-gray-500 block">Completed</span>
                  <span className="text-xl font-bold text-emerald-600">{completedCount} of {totalCourses}</span>
                </div>
              </div>
            </div>

            {/* Learning Progress Donut / Stats */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900 text-sm">Course Status</h3>
                <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                  Overall
                </span>
              </div>

              <div className="flex items-center gap-6 my-auto py-2">
                {/* Donut percentage ring */}
                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-gray-100"
                      strokeWidth="3.8"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-indigo-600"
                      strokeDasharray={`${avgProgress}, 100`}
                      strokeWidth="3.8"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-xl font-extrabold text-gray-900">{avgProgress}%</span>
                    <span className="text-[10px] text-gray-400 font-medium">Completed</span>
                  </div>
                </div>

                {/* Progress breakdown items */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-gray-50/70 border border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="font-bold text-gray-800">{completedCount}</span>
                      <span className="text-gray-500">Completed</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-gray-50/70 border border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                      <span className="font-bold text-gray-800">{inProgressCount}</span>
                      <span className="text-gray-500">In Progress</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-gray-50/70 border border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="font-bold text-gray-800">{upcomingCount}</span>
                      <span className="text-gray-500">Not Started</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Continue Learning Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-base">Enrolled Courses</h3>
              <div className="flex items-center gap-3">
                {/* Tabs: All / In Progress / Completed */}
                <div className="flex items-center gap-1 bg-gray-100/70 p-1 rounded-xl text-xs font-semibold">
                  {['All', 'In Progress', 'Completed'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <Link to="/my-courses" className="text-xs font-semibold text-indigo-600 hover:underline">
                  View All
                </Link>
              </div>
            </div>

            {/* Course Cards Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(n => <div key={n} className="h-44 bg-gray-100 rounded-2xl animate-pulse" />)}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100">
                <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">No courses in this category</p>
                <Link to="/courses" className="mt-3 inline-block text-xs font-semibold text-indigo-600 hover:underline">
                  Browse Course Catalog →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredCourses.map((item) => {
                  const course = item.course || {};
                  const progress = Number(item.progress || 0);
                  const courseId = item.courseId || course.id;
                  return (
                    <div
                      key={item.id || courseId}
                      className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="relative mb-3 rounded-xl overflow-hidden bg-gray-100 h-28">
                        <img
                          src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&auto=format'}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-2 right-2 bg-black/70 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {progress}%
                        </span>
                      </div>

                      <h4 className="font-bold text-gray-900 text-sm line-clamp-1 mb-1">{course.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-1 mb-3">{course.instructor || 'Instructor'}</p>

                      <div className="mt-auto">
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                          <div
                            style={{ width: `${progress}%` }}
                            className="h-full bg-indigo-600 rounded-full"
                          />
                        </div>
                        <Link
                          to={`/learn/${courseId}`}
                          className="w-full py-2 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-600 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 fill-indigo-600" /> Continue Learning
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Real Learning Stats Footer Bar */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Your Learning Metrics</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg font-extrabold text-gray-900">{totalCourses}</div>
                  <div className="text-xs text-gray-400">Total Enrolled</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg font-extrabold text-gray-900">{completedCount}</div>
                  <div className="text-xs text-gray-400">Courses Completed</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg font-extrabold text-gray-900">{activeHours}h</div>
                  <div className="text-xs text-gray-400">Estimated Content Time</div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* ── Right Profile Panel ─────────────────── */}
        <aside className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-gray-100 p-6 flex flex-col justify-between shrink-0">
          <div>
            {/* User Profile Header Card */}
            <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-white p-5 rounded-2xl border border-indigo-50/80 text-center mb-6">
              <div className="relative inline-block mx-auto mb-3">
                <img
                  src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`}
                  alt={fullName}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm"
                />
                <span className="w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full absolute bottom-1 right-1" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">{fullName}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{user?.email || roleTitle}</p>
              <span className="inline-flex items-center gap-1 mt-2.5 px-3 py-1 bg-white rounded-full text-indigo-700 text-xs font-semibold shadow-xs border border-indigo-100/60">
                Verified Student
              </span>
            </div>

            {/* Current Month Calendar Widget */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-gray-800">{currentMonth}</span>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-gray-400 font-semibold mb-1">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}
              </div>

              {/* Day cells highlighting today */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {Array.from({ length: 31 }, (_, i) => i + 1).slice(0, 28).map((d) => {
                  const isCurrent = d === todayDate;
                  return (
                    <span
                      key={d}
                      className={`h-7 flex items-center justify-center rounded-lg text-[11px] font-medium transition-colors ${
                        isCurrent
                          ? 'bg-indigo-600 text-white font-bold shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {d}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* My Learning Quick Links */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Quick Access</h4>
              <div className="space-y-2 text-xs">
                <Link to="/my-courses" className="flex items-center justify-between p-2 bg-white rounded-xl text-gray-700 hover:text-indigo-600 border border-gray-100 transition-colors font-medium">
                  <span>My Courses</span>
                  <span className="font-bold text-indigo-600">{totalCourses}</span>
                </Link>
                <Link to="/courses" className="flex items-center justify-between p-2 bg-white rounded-xl text-gray-700 hover:text-indigo-600 border border-gray-100 transition-colors font-medium">
                  <span>Explore Courses</span>
                  <span>→</span>
                </Link>
                <Link to="/profile" className="flex items-center justify-between p-2 bg-white rounded-xl text-gray-700 hover:text-indigo-600 border border-gray-100 transition-colors font-medium">
                  <span>Profile Settings</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default StudentDashboard;

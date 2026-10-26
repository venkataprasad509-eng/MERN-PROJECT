import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Users, DollarSign, Star, Plus, Edit2, Trash2,
  Eye, TrendingUp, AlertCircle, CheckCircle, Clock
} from 'lucide-react';
import courseService from '../services/courseService';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/helpers';
import { toast } from '../utils/toast';
import { useScrollToTop } from '../hooks/useCustomHooks';

const MONTHLY_REVENUE = [18000, 24000, 19500, 32000, 28500, 41000, 38000, 45000, 52000, 49000, 61000, 58000];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MAX_REV = Math.max(...MONTHLY_REVENUE);

const InstructorDashboard = () => {
  useScrollToTop();
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form, setForm] = useState({ title: '', shortDescription: '', price: '', level: 'Beginner', category: 'Web Development', thumbnail: '', status: 'draft' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    courseService.getAll({ limit: 50 })
      .then((d) => setCourses(d.courses?.slice(0, 6) || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalStudents = courses.reduce((s, c) => s + (c.enrolledStudents || 0), 0);
  const totalRevenue = courses.reduce((s, c) => s + (c.price || 0) * Math.floor((c.enrolledStudents || 0) * 0.01), 0);
  const avgRating = courses.length ? (courses.reduce((s, c) => s + (c.rating || 0), 0) / courses.length).toFixed(1) : '—';

  const handleFormChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingCourse) {
        const data = await courseService.update(editingCourse.id, { ...form, instructor: user.name });
        setCourses((prev) => prev.map((c) => c.id === editingCourse.id ? data.course : c));
        toast.success('Course updated!');
      } else {
        const data = await courseService.create({ ...form, instructor: user.name, instructorId: user.id });
        setCourses((prev) => [data.course, ...prev]);
        toast.success('Course created!');
      }
      setShowCreateForm(false); setEditingCourse(null);
      setForm({ title: '', shortDescription: '', price: '', level: 'Beginner', category: 'Web Development', thumbnail: '', status: 'draft' });
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course? (Demo only – resets on server restart)')) return;
    try {
      await courseService.remove(id);
      setCourses((prev) => prev.filter((c) => c.id !== id));
      toast.success('Course deleted (demo)');
    } catch (err) { toast.error(err.message); }
  };

  const openEdit = (course) => {
    setEditingCourse(course);
    setForm({ title: course.title, shortDescription: course.shortDescription, price: course.price, level: course.level, category: course.category, thumbnail: course.thumbnail, status: course.status });
    setShowCreateForm(true);
  };

  return (
    <div className="page-container py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instructor Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name}</p>
        </div>
        <button onClick={() => { setEditingCourse(null); setShowCreateForm(true); }}
          className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Course
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3 items-start text-sm text-amber-800">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <span><strong>DEV MODE:</strong> Course data is stored in memory and resets when the server restarts. Earnings and enrollment stats are simulated.</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { icon: BookOpen, label: 'My Courses', value: courses.length, color: 'border-indigo-500' },
          { icon: Users, label: 'Total Students', value: totalStudents.toLocaleString(), color: 'border-blue-500' },
          { icon: DollarSign, label: 'Est. Revenue', value: formatPrice(totalRevenue), color: 'border-green-500' },
          { icon: Star, label: 'Avg Rating', value: avgRating, color: 'border-amber-500' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className={`card p-5 flex items-center gap-4 border-l-4 ${color}`}>
            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Courses */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-900 mb-4">My Courses</h2>
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="card h-20 skeleton" />)}</div>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => (
                <div key={course.id} className="card p-4 flex gap-4 items-center">
                  <img src={course.thumbnail} alt={course.title}
                    className="w-20 h-14 object-cover rounded-lg shrink-0"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&auto=format'; }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm line-clamp-1">{course.title}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.enrolledStudents?.toLocaleString()}</span>
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{course.rating}</span>
                      <span>{formatPrice(course.price)}</span>
                      <span className={`badge capitalize ${course.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{course.status || 'draft'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link to={`/courses/${course.id}`} className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors" title="Preview"><Eye className="w-4 h-4" /></Link>
                    <button onClick={() => openEdit(course)} className="p-1.5 text-gray-400 hover:text-amber-600 transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(course.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue chart */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Revenue</h2>
          <div className="card p-5">
            <div className="flex items-end gap-1 h-36 mb-2">
              {MONTHLY_REVENUE.map((rev, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-indigo-500 hover:bg-indigo-600 transition-colors rounded-t cursor-pointer"
                    style={{ height: `${(rev / MAX_REV) * 100}%` }}
                    title={`${MONTHS[i]}: ${formatPrice(rev)}`}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              {MONTHS.map((m) => <div key={m} className="flex-1 text-center text-xs text-gray-400">{m.slice(0, 1)}</div>)}
            </div>
            <p className="text-center text-xs text-gray-500 mt-2">Hover bars for monthly detail (demo data)</p>
          </div>

          {/* Tips */}
          <div className="card p-5 mt-4">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">💡 Tips to Grow</h3>
            <ul className="space-y-2 text-xs text-gray-600">
              {['Add new lessons every week', 'Respond to student reviews quickly', 'Use high-quality thumbnails', 'Offer limited-time discounts'].map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />{tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Create/Edit modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-5">{editingCourse ? 'Edit Course' : 'Create New Course'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Title *</label>
                <input name="title" value={form.title} onChange={handleFormChange} required placeholder="e.g. Complete React Developer" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                <textarea name="shortDescription" value={form.shortDescription} onChange={handleFormChange} rows={2} className="input-field resize-none" placeholder="Brief overview of the course" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                  <input name="price" type="number" value={form.price} onChange={handleFormChange} required min="0" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <select name="level" value={form.level} onChange={handleFormChange} className="input-field">
                    {['Beginner', 'Intermediate', 'Advanced'].map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select name="category" value={form.category} onChange={handleFormChange} className="input-field">
                  {['Web Development', 'Python', 'JavaScript', 'Node.js', 'Data Science', 'UI/UX Design', 'Artificial Intelligence', 'DevOps', 'Design'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
                <input name="thumbnail" value={form.thumbnail} onChange={handleFormChange} placeholder="https://..." className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" value={form.status} onChange={handleFormChange} className="input-field">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-60">
                  {submitting ? 'Saving...' : editingCourse ? 'Save Changes' : 'Create Course'}
                </button>
                <button type="button" onClick={() => { setShowCreateForm(false); setEditingCourse(null); }} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorDashboard;

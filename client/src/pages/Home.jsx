import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Play, Star, Users, BookOpen, Award, ArrowRight } from 'lucide-react';
import courseService from '../services/courseService';
import CourseCard from '../components/courses/CourseCard';
import { CourseCardSkeleton } from '../components/common/Skeleton';
import { useScrollToTop } from '../hooks/useCustomHooks';

const STATS = [
  { icon: BookOpen, value: '12,000+', label: 'Courses' },
  { icon: Users, value: '850,000+', label: 'Students' },
  { icon: Star, value: '4.8', label: 'Average Rating' },
  { icon: Award, value: '480+', label: 'Instructors' },
];

const TESTIMONIALS = [
  { name: 'Ravi Teja', role: 'Frontend Developer at Infosys', text: 'LearnHub completely transformed my career. I went from knowing nothing about React to landing a job in 4 months!', avatar: 'https://i.pravatar.cc/150?img=11', rating: 5 },
  { name: 'Anjali Mehta', role: 'Data Scientist at TCS', text: 'The data science courses here are world-class. The instructors explain complex concepts in a way anyone can understand.', avatar: 'https://i.pravatar.cc/150?img=12', rating: 5 },
  { name: 'Suresh Babu', role: 'Full Stack Developer', text: 'I enrolled in the Web Dev bootcamp and it was the best investment I ever made. Now I work remotely from home!', avatar: 'https://i.pravatar.cc/150?img=13', rating: 5 },
];

const CATEGORIES = [
  { name: 'Web Development', icon: '🌐', count: '2,400+ courses', color: 'from-blue-500 to-blue-600' },
  { name: 'Python', icon: '🐍', count: '1,800+ courses', color: 'from-green-500 to-green-600' },
  { name: 'JavaScript', icon: '⚡', count: '2,100+ courses', color: 'from-yellow-500 to-amber-600' },
  { name: 'Data Science', icon: '📊', count: '1,500+ courses', color: 'from-purple-500 to-purple-600' },
  { name: 'UI/UX Design', icon: '🎨', count: '900+ courses', color: 'from-pink-500 to-pink-600' },
  { name: 'AI / ML', icon: '🤖', count: '1,200+ courses', color: 'from-cyan-500 to-cyan-600' },
  { name: 'DevOps', icon: '🔧', count: '700+ courses', color: 'from-orange-500 to-orange-600' },
  { name: 'Design', icon: '✏️', count: '600+ courses', color: 'from-red-500 to-red-600' },
];

const INSTRUCTORS = [
  { name: 'Dr. Angela Yu', specialty: 'Web Development', rating: 4.8, students: 856234, avatar: 'https://i.pravatar.cc/150?img=10' },
  { name: 'Dr. Charles Severance', specialty: 'Python', rating: 4.7, students: 712450, avatar: 'https://i.pravatar.cc/150?img=25' },
  { name: 'Maximilian Schwarzmüller', specialty: 'React & JS', rating: 4.9, students: 534780, avatar: 'https://i.pravatar.cc/150?img=30' },
  { name: 'Andrew Ng', specialty: 'AI & Deep Learning', rating: 4.9, students: 312890, avatar: 'https://i.pravatar.cc/150?img=35' },
];

const Home = () => {
  useScrollToTop();
  const [search, setSearch] = useState('');
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    courseService.getFeatured().then((d) => { setFeatured(d.courses || []); setLoadingFeatured(false); }).catch(() => setLoadingFeatured(false));
    courseService.getTrending().then((d) => { setTrending(d.courses || []); setLoadingTrending(false); }).catch(() => setLoadingTrending(false));
    courseService.getTopRated().then((d) => setTopRated(d.courses || [])).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/courses?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div>
      {/* ── Hero ────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white py-20 md:py-28 relative overflow-hidden border-b border-indigo-900/40">
        {/* Soft background glow accents */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="page-container relative text-center">
          <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6 text-indigo-200 shadow-sm">
            <Play className="w-3.5 h-3.5 text-amber-400" /> Over 12,000 courses available now
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
            Learn Without Limits.<br />
            <span className="text-amber-400">Build Without Boundaries.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto font-normal">
            Join 850,000+ students learning from world-class instructors. Start your journey today.
          </p>

          {/* Search bar with crisp contrast background */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto mb-6 p-1.5 bg-white/95 rounded-2xl shadow-2xl ring-1 ring-black/10 backdrop-blur">
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder='Try "React", "Python", "Machine Learning"...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl text-gray-900 bg-transparent placeholder-gray-500 focus:outline-none text-base"
              />
            </div>
            <button type="submit" className="bg-amber-400 hover:bg-amber-300 active:scale-95 text-gray-950 font-bold px-8 py-3.5 rounded-xl transition-all shadow-md shrink-0">
              Search
            </button>
          </form>

          <div className="flex flex-wrap justify-center items-center gap-2 text-sm text-slate-400">
            <span className="font-medium text-slate-300">Popular:</span>
            {['React', 'Python', 'Node.js', 'Machine Learning', 'Figma'].map((t) => (
              <button
                key={t}
                onClick={() => navigate(`/courses?search=${t}`)}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white rounded-lg transition-all text-xs font-medium"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Bar ──────────────────────────────── */}
      <section className="bg-white border-b border-gray-100 py-8 shadow-sm">
        <div className="page-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex flex-col items-center">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-2">
                  <Icon className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-sm text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ─────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="page-container">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="section-title">Top Categories</h2>
              <p className="section-subtitle mb-0">Explore our most popular subjects</p>
            </div>
            <Link to="/courses" className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm flex items-center gap-1">
              All Categories <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                to={`/courses?category=${encodeURIComponent(cat.name)}`}
                className="card p-5 hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div className="text-3xl mb-3">{cat.icon}</div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors text-sm">{cat.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{cat.count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Courses ───────────────────────── */}
      <section className="py-16 bg-white">
        <div className="page-container">
          <div className="flex justify-between items-end mb-10">
            <div>
              <span className="badge bg-indigo-100 text-indigo-700 mb-2">Hand-picked</span>
              <h2 className="section-title">Featured Courses</h2>
              <p className="section-subtitle mb-0">Courses chosen by our learning experts</p>
            </div>
            <Link to="/courses?featured=true" className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {loadingFeatured ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => <CourseCardSkeleton key={n} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((course) => <CourseCard key={course.id} course={course} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── Trending Courses ───────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="page-container">
          <div className="flex justify-between items-end mb-10">
            <div>
              <span className="badge bg-amber-100 text-amber-700 mb-2">Popular Now</span>
              <h2 className="section-title">Trending Courses</h2>
              <p className="section-subtitle mb-0">What everyone is learning right now</p>
            </div>
            <Link to="/courses?trending=true" className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {loadingTrending ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => <CourseCardSkeleton key={n} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trending.map((course) => <CourseCard key={course.id} course={course} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── Top Rated Courses ──────────────────────── */}
      {topRated.length > 0 && (
        <section className="py-16 bg-white">
          <div className="page-container">
            <div className="flex justify-between items-end mb-10">
              <div>
                <span className="badge bg-green-100 text-green-700 mb-2">Highest Rated</span>
                <h2 className="section-title">Top Rated Courses</h2>
                <p className="section-subtitle mb-0">Highest rated by thousands of students</p>
              </div>
              <Link to="/courses?sort=rating_desc" className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {topRated.slice(0, 4).map((course) => <CourseCard key={course.id} course={course} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Instructors Highlight ──────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="page-container">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="section-title">Learn from Top Instructors</h2>
            <p className="section-subtitle">Real-world experts who teach what they practice every day</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {INSTRUCTORS.map((inst) => (
              <div key={inst.name} className="card p-6 text-center hover:shadow-md transition-shadow">
                <img src={inst.avatar} alt={inst.name} className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-2 border-indigo-100" />
                <h3 className="font-bold text-gray-900">{inst.name}</h3>
                <p className="text-xs text-indigo-600 font-medium mb-3">{inst.specialty}</p>
                <div className="flex justify-center items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> {inst.rating}
                  </span>
                  <span>{(inst.students / 1000).toFixed(0)}k students</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="page-container">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="section-title">What Learners Say</h2>
            <p className="section-subtitle">Read how LearnHub changed careers around the world</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card p-6 flex flex-col justify-between">
                <div>
                  <div className="flex gap-1 text-amber-400 mb-4">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm italic mb-6">"{t.text}"</p>
                </div>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{t.name}</h4>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────── */}
      <section className="bg-indigo-600 text-white py-16">
        <div className="page-container text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Start Learning Today</h2>
          <p className="text-indigo-200 text-lg mb-8 max-w-xl mx-auto">
            Join millions of learners from around the world. Expand your skills and achieve your goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/courses" className="bg-white text-indigo-600 hover:bg-gray-100 font-bold px-8 py-3.5 rounded-xl transition-colors shadow-md">
              Explore All Courses
            </Link>
            <Link to="/register" className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold px-8 py-3.5 rounded-xl transition-colors border border-indigo-500">
              Join for Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, ChevronLeft, ChevronRight, X, Grid3X3, List } from 'lucide-react';
import courseService from '../services/courseService';
import CourseCard from '../components/courses/CourseCard';
import { CourseCardSkeleton } from '../components/common/Skeleton';
import { ErrorState, EmptyState } from '../components/common/StateComponents';
import { useDebounce, useScrollToTop } from '../hooks/useCustomHooks';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const SORT_OPTIONS = [
  { value: '', label: 'Most Relevant' },
  { value: 'rating_desc', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

const Courses = () => {
  useScrollToTop();
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState('grid');

  // Filter state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [level, setLevel] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sort, setSort] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 500);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 9 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (category) params.category = category;
      if (level) params.level = level;
      if (minRating) params.minRating = minRating;
      if (sort) params.sort = sort;
      if (searchParams.get('featured')) params.featured = 'true';
      if (searchParams.get('trending')) params.trending = 'true';
      if (searchParams.get('topRated')) params.topRated = 'true';
      const data = await courseService.getAll(params);
      setCourses(data.courses || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category, level, minRating, sort, page, searchParams]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const clearFilters = () => {
    setSearch(''); setCategory(''); setLevel(''); setMinRating(''); setSort(''); setPage(1);
    setSearchParams({});
  };

  const hasFilters = search || category || level || minRating;

  const FilterPanel = () => (
    <aside className="space-y-6">
      {/* Category */}
      <div>
        <h4 className="font-semibold text-gray-800 mb-3">Category</h4>
        <div className="space-y-1.5">
          {['Web Development', 'Python', 'JavaScript', 'Node.js', 'Data Science', 'UI/UX Design', 'Artificial Intelligence', 'DevOps', 'Design'].map((cat) => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer group">
              <input type="radio" name="category" checked={category === cat} onChange={() => { setCategory(cat); setPage(1); }}
                className="accent-indigo-600" />
              <span className="text-sm text-gray-600 group-hover:text-indigo-600 transition-colors">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Level */}
      <div>
        <h4 className="font-semibold text-gray-800 mb-3">Level</h4>
        <div className="space-y-1.5">
          {LEVELS.map((l) => (
            <label key={l} className="flex items-center gap-2 cursor-pointer group">
              <input type="radio" name="level" checked={level === l} onChange={() => { setLevel(l); setPage(1); }}
                className="accent-indigo-600" />
              <span className="text-sm text-gray-600 group-hover:text-indigo-600 transition-colors">{l}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h4 className="font-semibold text-gray-800 mb-3">Minimum Rating</h4>
        <div className="space-y-1.5">
          {['4.5', '4.0', '3.5'].map((r) => (
            <label key={r} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="rating" checked={minRating === r} onChange={() => { setMinRating(r); setPage(1); }}
                className="accent-indigo-600" />
              <span className="text-sm text-gray-600">{'⭐'.repeat(Math.round(Number(r)))} {r} & up</span>
            </label>
          ))}
        </div>
      </div>

      {hasFilters && (
        <button onClick={clearFilters} className="w-full text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-1">
          <X className="w-4 h-4" /> Clear all filters
        </button>
      )}
    </aside>
  );

  return (
    <div className="page-container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          {category ? `${category} Courses` : search ? `Results for "${search}"` : 'All Courses'}
        </h1>
        {pagination && <p className="text-gray-500">{pagination.totalItems} courses available</p>}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input-field flex-1 max-w-sm"
        />
        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="input-field w-auto">
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={() => setFiltersOpen(!filtersOpen)} className="btn-secondary flex items-center gap-2 lg:hidden">
          <SlidersHorizontal className="w-4 h-4" /> Filters {hasFilters && <span className="badge bg-indigo-600 text-white">!</span>}
        </button>
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => setView('grid')} className={`p-2 rounded ${view === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}><Grid3X3 className="w-4 h-4" /></button>
          <button onClick={() => setView('list')} className={`p-2 rounded ${view === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}><List className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar filters (desktop) */}
        <div className="hidden lg:block w-56 shrink-0">
          <FilterPanel />
        </div>

        {/* Mobile filters */}
        {filtersOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setFiltersOpen(false)}>
            <div className="absolute right-0 top-0 bottom-0 w-72 bg-white p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Filters</h3>
                <button onClick={() => setFiltersOpen(false)}><X className="w-5 h-5" /></button>
              </div>
              <FilterPanel />
            </div>
          </div>
        )}

        {/* Course grid */}
        <div className="flex-1">
          {error && <ErrorState message={error} onRetry={fetchCourses} />}
          {!error && !loading && courses.length === 0 && (
            <EmptyState
              title="No courses found"
              description="Try adjusting your search or filters"
              action={<button onClick={clearFilters} className="btn-primary">Clear Filters</button>}
            />
          )}
          {!error && (
            <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
              {loading
                ? [...Array(9)].map((_, i) => <CourseCardSkeleton key={i} />)
                : courses.map((c) => <CourseCard key={c.id} course={c} />)
              }
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button onClick={() => setPage((p) => p - 1)} disabled={!pagination.hasPrevPage}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === i + 1 ? 'bg-indigo-600 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage((p) => p + 1)} disabled={!pagination.hasNextPage}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Courses;

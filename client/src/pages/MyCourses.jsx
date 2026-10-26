
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Play,
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

import enrollmentService from '../services/enrollmentService';
import { EmptyState } from '../components/common/StateComponents';
import { CourseCardSkeleton } from '../components/common/Skeleton';
import { useScrollToTop } from '../hooks/useCustomHooks';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format';

const MyCourses = () => {
  useScrollToTop();

  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadEnrollments = async () => {
      try {
        setLoading(true);
        setError('');

        const result = await enrollmentService.getMyEnrollments();

        if (active) {
          setEnrollments(
            Array.isArray(result?.enrollments)
              ? result.enrollments
              : []
          );
        }
      } catch (err) {
        console.error('Failed to load enrolled courses:', err);

        if (active) {
          setError('Unable to load your courses. Please try again.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadEnrollments();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="page-container py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
        <BookOpen className="w-8 h-8 text-indigo-600" />
        My Courses
      </h1>

      <p className="text-gray-500 mb-8">
        Your enrolled courses and progress
      </p>

      {error ? (
        <div className="card p-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 mb-4">{error}</p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      ) : enrollments.length === 0 ? (
        <EmptyState
          title="No courses yet"
          description="You haven't enrolled in any courses yet. Browse the catalog to get started!"
          action={
            <Link to="/courses" className="btn-primary">
              Browse Courses
            </Link>
          }
        />
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-5">
            {enrollments.length}{' '}
            {enrollments.length === 1 ? 'course' : 'courses'} enrolled
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enrollment) => {
              const course = enrollment.course || {};

              const progress = Math.min(
                100,
                Math.max(0, Number(enrollment.progress) || 0)
              );

              const isCompleted = progress >= 100;

              const courseId =
                enrollment.courseId ?? course.id ?? enrollment.course_id;

              return (
                <div key={enrollment.id} className="card group">
                  <div className="relative overflow-hidden">
                    <img
                      src={course.thumbnail || FALLBACK_IMAGE}
                      alt={course.title || 'Course thumbnail'}
                      className="w-full h-44 object-cover"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />

                    {isCompleted && (
                      <div className="absolute inset-0 bg-green-900/60 flex items-center justify-center">
                        <CheckCircle className="w-12 h-12 text-white" />
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-200">
                      <div
                        className="h-full bg-indigo-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm mb-1">
                      {course.title || 'Untitled course'}
                    </h3>

                    <p className="text-xs text-gray-500 mb-3">
                      {course.instructor ||
                        course.instructorName ||
                        'Instructor'}
                    </p>

                    <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {course.duration || 'Duration not specified'}
                      </span>

                      <span
                        className={`font-semibold ${
                          isCompleted
                            ? 'text-green-600'
                            : 'text-indigo-600'
                        }`}
                      >
                        {isCompleted
                          ? '✓ Completed'
                          : `${Math.round(progress)}% done`}
                      </span>
                    </div>

                    {courseId != null ? (
                      <Link
                        to={`/learn/${courseId}`}
                        className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          isCompleted
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        <Play className="w-4 h-4" />
                        {isCompleted
                          ? 'Review Course'
                          : progress > 0
                            ? 'Continue Learning'
                            : 'Start Course'}
                      </Link>
                    ) : (
                      <p className="text-sm text-red-500">
                        Course link unavailable
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default MyCourses;

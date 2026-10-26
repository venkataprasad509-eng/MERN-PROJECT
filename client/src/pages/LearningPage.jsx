import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, CheckCircle, Circle, Play, BookOpen,
  ChevronDown, ChevronUp, Award, AlertCircle
} from 'lucide-react';
import courseService from '../services/courseService';
import enrollmentService from '../services/enrollmentService';
import { PageSkeleton } from '../components/common/Skeleton';
import { ErrorState } from '../components/common/StateComponents';
import { useScrollToTop } from '../hooks/useCustomHooks';

const LearningPage = () => {
  useScrollToTop();
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const courseData = await courseService.getById(courseId);
        const c = courseData.course;
        setCourse(c);
        // Try to get enrollment
        try {
          const enrollData = await enrollmentService.getMyEnrollments();
          const enr = enrollData.enrollments?.find((e) => e.courseId === courseId);
          if (enr) {
            setEnrollment(enr);
            setCompletedLessons(new Set(enr.completedLessons || []));
          }
        } catch (_) {}
        // Set first lesson
        if (c.curriculum?.length > 0 && c.curriculum[0].lessons?.length > 0) {
          setCurrentLesson(c.curriculum[0].lessons[0]);
          setExpandedSections({ [c.curriculum[0].id]: true });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error} />;
  if (!course) return null;

  const allLessons = course.curriculum?.flatMap((s) => s.lessons || []) || [];
  const totalLessons = allLessons.length;
  const currentIndex = currentLesson ? allLessons.findIndex((l) => l.id === currentLesson.id) : 0;
  const progress = totalLessons > 0 ? Math.round((completedLessons.size / totalLessons) * 100) : 0;

  const handleMarkComplete = async () => {
    if (!currentLesson || completedLessons.has(currentLesson.id)) return;
    setMarking(true);
    try {
      const newCompleted = new Set([...completedLessons, currentLesson.id]);
      setCompletedLessons(newCompleted);
      if (enrollment) {
        await enrollmentService.markLessonComplete({ enrollmentId: enrollment.id, lessonId: currentLesson.id });
      }
      // Auto-advance
      if (currentIndex < totalLessons - 1) {
        setTimeout(() => setCurrentLesson(allLessons[currentIndex + 1]), 400);
      }
    } catch (_) {} finally { setMarking(false); }
  };

  const isCompleted = currentLesson && completedLessons.has(currentLesson.id);
  const isFinished = completedLessons.size >= totalLessons;

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} shrink-0 bg-gray-800 border-r border-gray-700 overflow-y-auto transition-all duration-300`}>
        {sidebarOpen && (
          <div className="p-4">
            <Link to={`/courses/${courseId}`} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-4 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back to Course
            </Link>
            <h2 className="text-white font-bold text-sm mb-1 line-clamp-2">{course.title}</h2>
            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{completedLessons.size}/{totalLessons} lessons</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-700 rounded-full">
                <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Curriculum */}
            {course.curriculum?.map((section) => (
              <div key={section.id} className="mb-2">
                <button
                  onClick={() => setExpandedSections((prev) => ({ ...prev, [section.id]: !prev[section.id] }))}
                  className="w-full flex items-center justify-between p-2 text-gray-300 hover:text-white text-xs font-semibold text-left"
                >
                  <span className="line-clamp-1">{section.title}</span>
                  {expandedSections[section.id] ? <ChevronUp className="w-3 h-3 shrink-0" /> : <ChevronDown className="w-3 h-3 shrink-0" />}
                </button>
                {expandedSections[section.id] && (
                  <div className="space-y-0.5">
                    {section.lessons?.map((lesson) => {
                      const done = completedLessons.has(lesson.id);
                      const active = currentLesson?.id === lesson.id;
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => setCurrentLesson(lesson)}
                          className={`w-full flex items-start gap-2 p-2 rounded-lg text-left text-xs transition-colors ${active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                        >
                          {done ? <CheckCircle className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" /> : <Circle className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
                          <span className="line-clamp-2">{lesson.title}</span>
                          <span className="ml-auto text-xs shrink-0 opacity-60">{lesson.duration}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center gap-4 shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white transition-colors">
            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
          <span className="text-white font-semibold text-sm flex-1 min-w-0 truncate">{currentLesson?.title || 'Select a lesson'}</span>
          <div className="text-xs text-gray-400 shrink-0">
            {progress}% complete
          </div>
        </div>

        {/* Video area */}
        <div className="flex-1 overflow-y-auto bg-gray-900">
          {/* Video / content */}
          <div className="bg-black aspect-video max-h-[60vh] flex items-center justify-center">
            {currentLesson?.videoUrl ? (
              <iframe src={currentLesson.videoUrl} className="w-full h-full" allowFullScreen title={currentLesson.title} />
            ) : (
              <div className="text-center text-gray-400">
                <Play className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No video URL for this lesson</p>
                <p className="text-sm opacity-60 mt-1">Demo mode — read the description below</p>
              </div>
            )}
          </div>

          {/* Lesson content */}
          <div className="max-w-3xl mx-auto p-6">
            {isFinished && (
              <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-5 mb-6 text-center">
                <Award className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                <h2 className="text-white font-bold text-xl mb-1">🎉 Course Completed!</h2>
                <p className="text-gray-400 text-sm">Congratulations! You've completed all lessons.</p>
              </div>
            )}

            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-white text-xl font-bold">{currentLesson?.title}</h1>
                <p className="text-gray-400 text-sm mt-1">Lesson {currentIndex + 1} of {totalLessons}</p>
              </div>
              <button
                onClick={handleMarkComplete}
                disabled={isCompleted || marking}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isCompleted ? 'bg-green-900/50 text-green-400 cursor-default' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                } disabled:opacity-60`}
              >
                {isCompleted ? <><CheckCircle className="w-4 h-4" /> Completed</> : marking ? 'Marking...' : <><Circle className="w-4 h-4" /> Mark Complete</>}
              </button>
            </div>

            {currentLesson?.description && (
              <div className="bg-gray-800 rounded-xl p-5 mb-5">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-400" /> Lesson Description</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{currentLesson.description}</p>
              </div>
            )}

            {currentLesson?.resources && (
              <div className="bg-gray-800 rounded-xl p-5 mb-5">
                <h3 className="text-white font-semibold mb-2">Resources</h3>
                <ul className="space-y-1">
                  {currentLesson.resources.map((r, i) => (
                    <li key={i} className="text-indigo-400 text-sm hover:underline cursor-pointer">{r}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button onClick={() => currentIndex > 0 && setCurrentLesson(allLessons[currentIndex - 1])}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 disabled:opacity-40 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button onClick={() => currentIndex < totalLessons - 1 && setCurrentLesson(allLessons[currentIndex + 1])}
                disabled={currentIndex >= totalLessons - 1}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-500 disabled:opacity-40 transition-colors">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPage;

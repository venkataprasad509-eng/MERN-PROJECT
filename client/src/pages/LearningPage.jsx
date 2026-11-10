
import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  Play,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Award,
  AlertCircle,
  LoaderCircle,
} from 'lucide-react';

import courseService from '../services/courseService';
import lessonService from '../services/lessonService';
import enrollmentService from '../services/enrollmentService';

import { PageSkeleton } from '../components/common/Skeleton';
import { ErrorState } from '../components/common/StateComponents';
import { useScrollToTop } from '../hooks/useCustomHooks';
import { toast } from '../utils/toast';

const LearningPage = () => {
  useScrollToTop();

  const { courseId } = useParams();

  const videoRef = useRef(null);
  const lastSaveTime = useRef(0);
  const savedPositions = useRef({});

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [videoUrl, setVideoUrl] = useState('');

  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(false);
  const [error, setError] = useState(null);

  const [currentLesson, setCurrentLesson] = useState(null);
  const [completedLessons, setCompletedLessons] = useState(new Set());

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const [marking, setMarking] = useState(false);

  // Load course, lessons, enrollment and saved progress
  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const courseData = await courseService.getById(courseId);
        const currentCourse = courseData.course;

        if (!currentCourse) {
          throw new Error('Course not found.');
        }

        const [lessonData, enrollmentData, progressData] =
          await Promise.all([
            lessonService.getLessons(currentCourse.id),
            enrollmentService.getMyEnrollments(),
            lessonService.getLessonProgress(currentCourse.id),
          ]);

        if (!active) return;

        const studentEnrollment =
          enrollmentData.enrollments?.find((item) => {
            const enrolledCourseId =
              item.courseId ??
              item.course_id ??
              item.course?.id;

            return String(enrolledCourseId) === String(currentCourse.id);
          }) || null;

        if (!studentEnrollment) {
          throw new Error(
            'You are not enrolled in this course. Please purchase the course first.'
          );
        }

        setCourse(currentCourse);
        setEnrollment(studentEnrollment);
        setLessons(lessonData);

        const progressMap = {};

        progressData.forEach((item) => {
          progressMap[String(item.lesson_id)] = item;
        });

        savedPositions.current = progressMap;

        const completed = new Set(
          progressData
            .filter((item) => item.is_completed)
            .map((item) => String(item.lesson_id))
        );

        setCompletedLessons(completed);

        // Restore the most recently watched lesson
        const lastWatched = [...progressData]
          .filter((item) => Number(item.video_position) > 0)
          .sort(
            (a, b) =>
              new Date(b.updated_at) - new Date(a.updated_at)
          )[0];

        const initialLesson =
          lessonData.find(
            (item) =>
              String(item.id) === String(lastWatched?.lesson_id)
          ) ||
          lessonData.find(
            (item) => !completed.has(String(item.id))
          ) ||
          lessonData[0] ||
          null;

        setCurrentLesson(initialLesson);

      } catch (err) {
        console.error('Learning page error:', err);

        if (active) {
          setError(err.message || 'Unable to load course.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [courseId]);

  // Generate the video URL whenever the selected lesson changes
  useEffect(() => {
    let active = true;

    const loadVideo = async () => {
      setVideoUrl('');

      if (!currentLesson?.video_path) return;

      try {
        setVideoLoading(true);

        const url = await lessonService.getVideoUrl(
          currentLesson.video_path
        );

        if (active) {
          setVideoUrl(url);
        }
      } catch (err) {
        console.error('Video loading error:', err);

        if (active) {
          toast.error('Unable to load this lesson video.');
        }
      } finally {
        if (active) {
          setVideoLoading(false);
        }
      }
    };

    loadVideo();

    return () => {
      active = false;
    };
  }, [currentLesson]);

  const totalLessons = lessons.length;

  const currentIndex = currentLesson
    ? lessons.findIndex(
        (lesson) => String(lesson.id) === String(currentLesson.id)
      )
    : -1;

  const progress =
    totalLessons > 0
      ? Math.round((completedLessons.size / totalLessons) * 100)
      : 0;

  // Save the current video position to Supabase
  const saveCurrentPosition = async () => {
    const video = videoRef.current;

    if (!video || !currentLesson || !course) return;

    const position = video.currentTime || 0;
    const duration = video.duration || 0;

    if (!Number.isFinite(position) || position <= 0) return;

    try {
      const result = await lessonService.saveLessonProgress({
        courseId: course.id,
        lessonId: currentLesson.id,
        videoPosition: position,
        videoDuration: duration,
        isCompleted: completedLessons.has(
          String(currentLesson.id)
        ),
      });

      savedPositions.current[String(currentLesson.id)] = result;
    } catch (err) {
      console.error('Progress save failed:', err);
    }
  };

  // Restore saved position after video metadata loads
  const handleVideoLoaded = () => {
    const video = videoRef.current;

    if (!video || !currentLesson) return;

    const saved =
      savedPositions.current[String(currentLesson.id)];

    const savedPosition = Number(saved?.video_position) || 0;

    if (
      savedPosition > 0 &&
      savedPosition < video.duration - 3
    ) {
      video.currentTime = savedPosition;
      toast.info('Resuming from where you left off.');
    }

    lastSaveTime.current = 0;
  };

  // Save approximately every five seconds during playback
  const handleTimeUpdate = () => {
    const video = videoRef.current;

    if (!video) return;

    const now = Date.now();

    if (now - lastSaveTime.current >= 5000) {
      lastSaveTime.current = now;
      saveCurrentPosition();
    }
  };

  // Mark a lesson as completed
  const handleMarkComplete = async () => {
    if (
      !currentLesson ||
      !enrollment ||
      completedLessons.has(String(currentLesson.id)) ||
      marking
    ) {
      return;
    }

    setMarking(true);

    try {
      const video = videoRef.current;

      const duration = video?.duration || 0;

      await lessonService.saveLessonProgress({
        courseId: course.id,
        lessonId: currentLesson.id,
        videoPosition: duration,
        videoDuration: duration,
        isCompleted: true,
      });

      await enrollmentService.markLessonComplete({
        enrollmentId: enrollment.id,
        lessonId: currentLesson.id,
      });

      const updatedCompleted = new Set([
        ...completedLessons,
        String(currentLesson.id),
      ]);

      setCompletedLessons(updatedCompleted);

      savedPositions.current[String(currentLesson.id)] = {
        video_position: duration,
        video_duration: duration,
        is_completed: true,
      };

      const updatedProgress = Math.round(
        (updatedCompleted.size / totalLessons) * 100
      );

      await enrollmentService.updateProgress(
        enrollment.id,
        updatedProgress
      );

      toast.success('Lesson completed!');

      if (currentIndex < totalLessons - 1) {
        setCurrentLesson(lessons[currentIndex + 1]);
      }
    } catch (err) {
      console.error('Unable to mark lesson complete:', err);
      toast.error(
        err.message || 'Unable to update lesson progress.'
      );
    } finally {
      setMarking(false);
    }
  };

  const selectLesson = async (lesson) => {
    if (
      String(lesson.id) === String(currentLesson?.id)
    ) {
      return;
    }

    // Save the current lesson before switching
    await saveCurrentPosition();

    setCurrentLesson(lesson);
  };

  const isCompleted =
    currentLesson &&
    completedLessons.has(String(currentLesson.id));

  const isFinished =
    totalLessons > 0 &&
    completedLessons.size >= totalLessons;

  if (loading) return <PageSkeleton />;

  if (error) return <ErrorState message={error} />;

  if (!course) return null;

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-80' : 'w-0'
        } shrink-0 bg-gray-800 border-r border-gray-700 overflow-y-auto transition-all duration-300`}
      >
        {sidebarOpen && (
          <div className="p-4">

            <Link
              to={`/courses/${courseId}`}
              className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Course
            </Link>

            <h2 className="text-white font-bold text-sm mb-4">
              {course.title}
            </h2>

            {/* Course progress */}
            <div className="mb-5">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>
                  {completedLessons.size}/{totalLessons} lessons
                </span>

                <span>{progress}%</span>
              </div>

              <div className="h-1.5 bg-gray-700 rounded-full">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Lesson list */}
            {lessons.map((lesson, index) => {
              const done = completedLessons.has(
                String(lesson.id)
              );

              const active =
                String(currentLesson?.id) === String(lesson.id);

              return (
                <button
                  key={lesson.id}
                  onClick={() => selectLesson(lesson)}
                  className={`w-full flex items-start gap-2 p-3 rounded-lg text-left text-xs mb-1 ${
                    active
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {done ? (
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 shrink-0" />
                  )}

                  <span className="flex-1">
                    {lesson.lesson_order || index + 1}.{' '}
                    {lesson.title}
                  </span>

                  {savedPositions.current[String(lesson.id)]
                    ?.video_position > 0 && !done && (
                    <span className="text-indigo-300 text-xs">
                      Resume
                    </span>
                  )}
                </button>
              );
            })}

            {lessons.length === 0 && (
              <p className="text-gray-400 text-sm">
                No lessons available yet.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center gap-4 shrink-0">

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white"
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>

          <span className="text-white font-semibold text-sm flex-1 truncate">
            {currentLesson?.title || 'Select a lesson'}
          </span>

          <span className="text-xs text-gray-400">
            {progress}% complete
          </span>
        </div>

        {/* Video area */}
        <div className="flex-1 overflow-y-auto bg-gray-900">

          <div className="bg-black aspect-video max-h-[60vh] flex items-center justify-center">

            {videoLoading ? (
              <div className="text-center text-white">
                <LoaderCircle className="w-10 h-10 animate-spin mx-auto mb-3" />
                Loading video...
              </div>
            ) : videoUrl ? (
              <video
                key={currentLesson?.id}
                ref={videoRef}
                src={videoUrl}
                controls
                playsInline
                className="w-full h-full object-contain"
                onLoadedMetadata={handleVideoLoaded}
                onTimeUpdate={handleTimeUpdate}
                onPause={saveCurrentPosition}
                onEnded={handleMarkComplete}
              >
                Your browser does not support HTML5 video.
              </video>
            ) : (
              <div className="text-center text-gray-400 p-6">
                <Play className="w-16 h-16 mx-auto mb-4 opacity-30" />

                <p className="text-lg font-medium">
                  {currentLesson
                    ? 'No video available for this lesson'
                    : 'Select a lesson'}
                </p>

                <p className="text-sm opacity-60 mt-2">
                  The instructor may not have uploaded a video yet.
                </p>
              </div>
            )}
          </div>

          {/* Lesson details */}
          <div className="max-w-3xl mx-auto p-6">

            {isFinished && (
              <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-5 mb-6 text-center">
                <Award className="w-12 h-12 text-yellow-400 mx-auto mb-2" />

                <h2 className="text-white font-bold text-xl mb-1">
                  🎉 Course Completed!
                </h2>

                <p className="text-gray-400 text-sm">
                  Congratulations! You've completed all lessons.
                </p>
              </div>
            )}

            {currentLesson && (
              <>
                <div className="flex items-center justify-between gap-4 mb-6">

                  <div>
                    <h1 className="text-white text-xl font-bold">
                      {currentLesson.title}
                    </h1>

                    <p className="text-gray-400 text-sm mt-1">
                      Lesson {currentIndex + 1} of {totalLessons}
                    </p>
                  </div>

                  <button
                    onClick={handleMarkComplete}
                    disabled={isCompleted || marking}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
                      isCompleted
                        ? 'bg-green-900/50 text-green-400'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    } disabled:opacity-60`}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Completed
                      </>
                    ) : marking ? (
                      'Saving...'
                    ) : (
                      <>
                        <Circle className="w-4 h-4" />
                        Mark Complete
                      </>
                    )}
                  </button>
                </div>

                {currentLesson.description && (
                  <div className="bg-gray-800 rounded-xl p-5 mb-5">
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      Lesson Description
                    </h3>

                    <p className="text-gray-300 text-sm leading-relaxed">
                      {currentLesson.description}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-3">

                  <button
                    onClick={() =>
                      currentIndex > 0 &&
                      selectLesson(lessons[currentIndex - 1])
                    }
                    disabled={currentIndex <= 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <button
                    onClick={() =>
                      currentIndex < totalLessons - 1 &&
                      selectLesson(lessons[currentIndex + 1])
                    }
                    disabled={currentIndex >= totalLessons - 1}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-500 disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>

                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPage;

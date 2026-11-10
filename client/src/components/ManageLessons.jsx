import { useEffect, useState } from 'react';
import { Upload, Video, Trash2, X, Loader2 } from 'lucide-react';
import lessonService from '../services/lessonService';
import supabase from '../services/supabase';
import { toast } from '../utils/toast';

const ManageLessons = ({ course, onClose }) => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);

  // Support different course ID property names.
  const courseId = Number(
    course?.id ?? course?.course_id ?? course?.courseId
  );

  const validCourseId = Number.isSafeInteger(courseId) && courseId > 0;

  const loadLessons = async () => {
    if (!validCourseId) {
      setLoading(false);
      toast.error('Invalid course ID. Please check your course details.');
      return;
    }

    try {
      setLoading(true);

      const data = await lessonService.getLessons(courseId);

      setLessons(data);
    } catch (error) {
      toast.error(error.message || 'Failed to load lessons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLessons();
  }, [courseId]);

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!validCourseId) {
      toast.error('Invalid course ID. Cannot upload video.');
      return;
    }

    if (!title.trim() || !file) {
      toast.error('Enter a lesson title and select a video');
      return;
    }

    if (!['video/mp4', 'video/webm'].includes(file.type)) {
      toast.error('Only MP4 and WebM videos are allowed');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Video must be smaller than 50 MB');
      return;
    }

    setUploading(true);

    try {
      await lessonService.uploadLesson({
        courseId,
        title: title.trim(),
        description: description.trim(),
        file,
        lessonOrder: lessons.length + 1,
      });

      toast.success('Video uploaded successfully!');

      setTitle('');
      setDescription('');
      setFile(null);

      e.target.reset();

      await loadLessons();
    } catch (error) {
      toast.error(error.message || 'Video upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (lesson) => {
    if (!window.confirm(`Delete "${lesson.title}"?`)) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('course-videos')
        .remove([lesson.video_path]);

      if (storageError) throw storageError;

      const { error: databaseError } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lesson.id);

      if (databaseError) throw databaseError;

      toast.success('Lesson deleted successfully');

      await loadLessons();
    } catch (error) {
      toast.error(error.message || 'Failed to delete lesson');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Manage Lessons
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              {course?.title}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!validCourseId ? (
          <div className="border border-red-200 bg-red-50 rounded-xl p-5 text-center">
            <p className="text-red-600 font-medium">
              Invalid course ID.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              The course ID is missing. Please check the course data.
            </p>
          </div>
        ) : (
          <>
            <form
              onSubmit={handleUpload}
              className="space-y-4 border rounded-xl p-4"
            >
              <h3 className="font-semibold text-gray-900">
                Add New Lesson
              </h3>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Lesson Title *
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Example: Introduction to Python"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What will students learn in this lesson?"
                  className="input-field"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Select Video *
                </label>

                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm border rounded-lg p-3"
                  required
                />

                <p className="text-xs text-gray-500 mt-1">
                  MP4 or WebM. Maximum size: 50 MB.
                </p>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Video
                  </>
                )}
              </button>
            </form>

            <div className="mt-7">
              <h3 className="font-semibold text-gray-900 mb-3">
                Uploaded Lessons ({lessons.length})
              </h3>

              {loading ? (
                <p className="text-sm text-gray-500">
                  Loading lessons...
                </p>
              ) : lessons.length === 0 ? (
                <div className="text-center border rounded-xl p-6">
                  <Video className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    No lessons uploaded yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between border rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Video className="w-5 h-5 text-indigo-600 shrink-0" />

                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900">
                            {lesson.lesson_order}. {lesson.title}
                          </p>

                          <p className="text-xs text-gray-500 truncate">
                            {lesson.description || 'No description'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(lesson)}
                        className="text-red-500 hover:text-red-700 p-2"
                        title="Delete lesson"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <button
          type="button"
          onClick={onClose}
          className="btn-secondary w-full mt-6"
        >
          Close
        </button>

      </div>
    </div>
  );
};

export default ManageLessons;
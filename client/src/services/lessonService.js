
import supabase from './supabase';

const BUCKET_NAME = 'course-videos';

const lessonService = {
  // Upload a video and save its lesson details
  async uploadLesson({ courseId, title, description, file, lessonOrder }) {
    if (!courseId || !title || !file) {
      throw new Error('Course, lesson title and video are required.');
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Please log in using your instructor account.');
    }

    if (!file.type.startsWith('video/')) {
      throw new Error('Please select a valid video file.');
    }

    const fileExtension = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExtension}`;
    const videoPath = `${courseId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(videoPath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    const { data, error: insertError } = await supabase
      .from('lessons')
      .insert({
        course_id: Number(courseId),
        title,
        description: description || null,
        video_path: videoPath,
        duration: 0,
        lesson_order: lessonOrder || 1,
      })
      .select()
      .single();

    if (insertError) {
      await supabase.storage.from(BUCKET_NAME).remove([videoPath]);
      throw insertError;
    }

    return data;
  },

  // Get lessons belonging to a course
  async getLessons(courseId) {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', Number(courseId))
      .order('lesson_order', { ascending: true });

    if (error) throw error;

    return data || [];
  },

  // Generate a temporary URL for a private Supabase Storage video
  async getVideoUrl(videoPath) {
    if (!videoPath) return null;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(videoPath, 3600);

    if (error) throw error;

    return data.signedUrl;
  },

  // Get saved progress for the logged-in student
  async getLessonProgress(courseId) {
    const { data, error } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('course_id', Number(courseId));

    if (error) throw error;

    return data || [];
  },

  // Save or update the current video position
  async saveLessonProgress({
    courseId,
    lessonId,
    videoPosition,
    videoDuration,
    isCompleted = false,
  }) {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Please log in to save your progress.');
    }

    const { data, error } = await supabase
      .from('lesson_progress')
      .upsert(
        {
          user_id: user.id,
          course_id: Number(courseId),
          lesson_id: String(lessonId),
          video_position: Number(videoPosition) || 0,
          video_duration: Number(videoDuration) || 0,
          is_completed: isCompleted,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,lesson_id',
        }
      )
      .select()
      .single();

    if (error) throw error;

    return data;
  },
};

export default lessonService;

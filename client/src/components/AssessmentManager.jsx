
import { useEffect, useState } from 'react';
import {
  Plus,
  ClipboardList,
  BookOpen,
  Clock,
  Calendar,
  Trash2,
  X,
} from 'lucide-react';

import assessmentService from '../services/assessmentService';
import { toast } from '../utils/toast';

const emptyQuestion = () => ({
  questionText: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
  marks: 1,
});

const AssessmentManager = ({ courses = [] }) => {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'assignment',
    dueDate: '',
    maxMarks: 100,
    timeLimit: 30,
    status: 'draft',
    submissionInstructions: '',
    questions: [emptyQuestion()],
  });

  useEffect(() => {
    if (courses.length > 0 && !selectedCourse) {
      setSelectedCourse(String(courses[0].id));
    }
  }, [courses, selectedCourse]);

  useEffect(() => {
    if (selectedCourse) {
      loadAssessments();
    } else {
      setAssessments([]);
    }
  }, [selectedCourse]);

  const loadAssessments = async () => {
    try {
      setLoading(true);

      const response =
        await assessmentService.getInstructorAssessments(
          selectedCourse
        );

      setAssessments(response.data || []);
    } catch (error) {
      toast.error(error.message || 'Unable to load assessments.');
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateQuestion = (questionIndex, field, value) => {
    setForm((previous) => ({
      ...previous,
      questions: previous.questions.map((question, index) =>
        index === questionIndex
          ? { ...question, [field]: value }
          : question
      ),
    }));
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    setForm((previous) => ({
      ...previous,
      questions: previous.questions.map((question, index) => {
        if (index !== questionIndex) return question;

        return {
          ...question,
          options: question.options.map((option, i) =>
            i === optionIndex ? value : option
          ),
        };
      }),
    }));
  };

  const addQuestion = () => {
    setForm((previous) => ({
      ...previous,
      questions: [...previous.questions, emptyQuestion()],
    }));
  };

  const removeQuestion = (questionIndex) => {
    setForm((previous) => ({
      ...previous,
      questions: previous.questions.filter(
        (_, index) => index !== questionIndex
      ),
    }));
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      type: 'assignment',
      dueDate: '',
      maxMarks: 100,
      timeLimit: 30,
      status: 'draft',
      submissionInstructions: '',
      questions: [emptyQuestion()],
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedCourse) {
      toast.error('Please select a course.');
      return;
    }

    if (form.type === 'quiz') {
      for (let i = 0; i < form.questions.length; i += 1) {
        const question = form.questions[i];

        if (!question.questionText.trim()) {
          toast.error(`Please enter question ${i + 1}.`);
          return;
        }

        if (question.options.some((option) => !option.trim())) {
          toast.error(
            `Please fill all options for question ${i + 1}.`
          );
          return;
        }
      }
    }

    try {
      setSaving(true);

      const payload = {
        courseId: selectedCourse,
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        maxMarks: Number(form.maxMarks),
        dueDate: form.dueDate || null,
        status: form.status,
        timeLimit:
          form.type === 'quiz' ? Number(form.timeLimit) : null,
        questions:
          form.type === 'quiz'
            ? form.questions.map((question) => ({
                questionText: question.questionText.trim(),
                options: question.options.map((text) => ({
                  text: text.trim(),
                })),
                correctAnswer: Number(question.correctAnswer),
                marks: Number(question.marks),
              }))
            : [],
      };

      await assessmentService.create(payload);

      toast.success('Assessment created successfully.');

      resetForm();
      setShowForm(false);
      await loadAssessments();
    } catch (error) {
      toast.error(error.message || 'Unable to create assessment.');
    } finally {
      setSaving(false);
    }
  };

  const selectedCourseName =
    courses.find(
      (course) => String(course.id) === selectedCourse
    )?.title || 'Selected course';

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-black placeholder:text-gray-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500';

  const labelClass =
    'mb-2 block text-sm font-medium text-gray-800';

  const selectClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-black outline-none focus:border-indigo-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Assignments & Quizzes
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Create and manage assessments for your students.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((previous) => !previous)}
          disabled={!selectedCourse}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 font-medium text-black hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Close Form' : 'Create Assessment'}
        </button>
      </div>

      {/* Course selection */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <label className={labelClass}>
          Select Course
        </label>

        <select
          value={selectedCourse}
          onChange={(event) => setSelectedCourse(event.target.value)}
          className={`${selectClass} sm:max-w-md`}
        >
          {courses.length === 0 && (
            <option value="">No courses available</option>
          )}

          {courses.map((course) => (
            <option key={course.id} value={String(course.id)}>
              {course.title}
            </option>
          ))}
        </select>

        <p className="mt-2 text-sm text-gray-600">
          Managing assessments for: {selectedCourseName}
        </p>
      </div>

      {/* Create assessment form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 text-black shadow-sm"
        >
          <h3 className="text-lg font-bold text-gray-900">
            Create New Assessment
          </h3>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>
                Assessment Title *
              </label>

              <input
                required
                value={form.title}
                onChange={(event) =>
                  updateForm('title', event.target.value)
                }
                placeholder="Example: JavaScript Fundamentals"
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>
                Description / Instructions
              </label>

              <textarea
                rows={3}
                value={form.description}
                onChange={(event) =>
                  updateForm('description', event.target.value)
                }
                placeholder="Explain what students need to do..."
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Assessment Type *
              </label>

              <select
                value={form.type}
                onChange={(event) =>
                  updateForm('type', event.target.value)
                }
                className={selectClass}
              >
                <option value="assignment">Practical Assignment</option>
                <option value="quiz">MCQ Quiz</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Maximum Marks *
              </label>

              <input
                type="number"
                min="1"
                required
                value={form.maxMarks}
                onChange={(event) =>
                  updateForm('maxMarks', event.target.value)
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Due Date
              </label>

              <input
                type="datetime-local"
                value={form.dueDate}
                onChange={(event) =>
                  updateForm('dueDate', event.target.value)
                }
                className={inputClass}
              />
            </div>

            {form.type === 'quiz' && (
              <div>
                <label className={labelClass}>
                  Time Limit (minutes)
                </label>

                <input
                  type="number"
                  min="1"
                  value={form.timeLimit}
                  onChange={(event) =>
                    updateForm('timeLimit', event.target.value)
                  }
                  className={inputClass}
                />
              </div>
            )}

            <div>
              <label className={labelClass}>
                Publication Status
              </label>

              <select
                value={form.status}
                onChange={(event) =>
                  updateForm('status', event.target.value)
                }
                className={selectClass}
              >
                <option value="draft">Save as Draft</option>
                <option value="published">Publish</option>
              </select>
            </div>
          </div>

          {/* Quiz questions */}
          {form.type === 'quiz' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900">
                  Quiz Questions
                </h4>

                <button
                  type="button"
                  onClick={addQuestion}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  <Plus size={16} />
                  Add Question
                </button>
              </div>

              {form.questions.map((question, questionIndex) => (
                <div
                  key={questionIndex}
                  className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-gray-900">
                      Question {questionIndex + 1}
                    </h5>

                    {form.questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(questionIndex)}
                        className="text-red-500 hover:text-red-700"
                        title="Remove question"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  <textarea
                    required
                    rows={2}
                    value={question.questionText}
                    onChange={(event) =>
                      updateQuestion(
                        questionIndex,
                        'questionText',
                        event.target.value
                      )
                    }
                    placeholder="Enter your question..."
                    className={inputClass}
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex}>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                          Option {optionIndex + 1}
                        </label>

                        <input
                          required
                          value={option}
                          onChange={(event) =>
                            updateOption(
                              questionIndex,
                              optionIndex,
                              event.target.value
                            )
                          }
                          placeholder={`Enter option ${optionIndex + 1}`}
                          className={inputClass}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>
                        Correct Answer
                      </label>

                      <select
                        value={question.correctAnswer}
                        onChange={(event) =>
                          updateQuestion(
                            questionIndex,
                            'correctAnswer',
                            Number(event.target.value)
                          )
                        }
                        className={selectClass}
                      >
                        {question.options.map((_, index) => (
                          <option key={index} value={index}>
                            Option {index + 1}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>
                        Question Marks
                      </label>

                      <input
                        type="number"
                        min="1"
                        value={question.marks}
                        onChange={(event) =>
                          updateQuestion(
                            questionIndex,
                            'marks',
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Form buttons */}
          <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-5">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-800 hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Assessment'}
            </button>
          </div>
        </form>
      )}

      {/* Assessment list */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">
          Your Assessments
        </h3>

        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-700">
            Loading assessments...
          </div>
        ) : assessments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <ClipboardList
              size={40}
              className="mx-auto mb-3 text-gray-400"
            />

            <h4 className="font-semibold text-gray-800">
              No assessments yet
            </h4>

            <p className="mt-1 text-sm text-gray-500">
              Create your first assignment or quiz for this course.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {assessments.map((assessment) => (
              <div
                key={assessment._id}
                className="rounded-xl border border-gray-200 bg-white p-5"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {assessment.type === 'quiz' ? (
                      <BookOpen className="text-indigo-600" size={20} />
                    ) : (
                      <ClipboardList className="text-indigo-600" size={20} />
                    )}

                    <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                      {assessment.type}
                    </span>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      assessment.status === 'published'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {assessment.status}
                  </span>
                </div>

                <h4 className="text-lg font-bold text-gray-900">
                  {assessment.title}
                </h4>

                <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                  {assessment.description || 'No description provided.'}
                </p>

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <ClipboardList size={15} />
                    {assessment.maxMarks} marks
                  </span>

                  {assessment.type === 'quiz' && (
                    <span className="flex items-center gap-1">
                      <Clock size={15} />
                      {assessment.timeLimit || 0} min
                    </span>
                  )}

                  {assessment.dueDate && (
                    <span className="flex items-center gap-1">
                      <Calendar size={15} />
                      {new Date(assessment.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {assessment.type === 'quiz' && (
                  <p className="mt-3 text-xs text-gray-500">
                    {assessment.questions?.length || 0} questions
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentManager;

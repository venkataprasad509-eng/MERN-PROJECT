
import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Search,
  Mail,
  BookOpen,
  Calendar,
  LoaderCircle,
} from 'lucide-react';
import enrollmentService from '../services/enrollmentService';

function InstructorStudents() {
  const [students, setStudents] = useState([]);
  const [courseCounts, setCourseCounts] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadStudents = async () => {
      try {
        setLoading(true);
        setError('');

        const response =
          await enrollmentService.getInstructorStudents();

        if (!active) return;

        setStudents(response.students || []);
        setCourseCounts(response.courseCounts || []);
        setTotalStudents(response.totalStudents || 0);
      } catch (err) {
        if (!active) return;

        setError(
          err.response?.data?.message ||
          err.message ||
          'Unable to load students.'
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    loadStudents();

    return () => {
      active = false;
    };
  }, []);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return students;

    return students.filter((student) =>
      [
        student.studentName,
        student.studentEmail,
        student.courseTitle,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [students, search]);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-gray-500">
        <LoaderCircle className="h-6 w-6 animate-spin" />
        Loading students...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          My Students
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          View students enrolled in your courses.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Total Enrollments
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {totalStudents}
              </p>
            </div>

            <div className="rounded-xl bg-indigo-50 p-3">
              <Users className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Your Courses
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {courseCounts.length}
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-3">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Students by Course
        </h3>

        {courseCounts.length === 0 ? (
          <p className="text-sm text-gray-500">
            You haven't created any courses yet.
          </p>
        ) : (
          <div className="space-y-3">
            {courseCounts.map((course) => (
              <div
                key={course.courseId}
                className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 p-4"
              >
                <p className="font-medium text-gray-800">
                  {course.courseTitle}
                </p>

                <span className="shrink-0 rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">
                  {course.studentCount} students
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-5">
          <h3 className="text-lg font-semibold text-gray-900">
            Enrolled Students
          </h3>

          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student, email or course..."
              className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-gray-300" />

            <p className="font-medium text-gray-700">
              {students.length === 0
                ? 'No students enrolled yet'
                : 'No matching students found'}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              {students.length === 0
                ? 'Students will appear here when they enroll in your courses.'
                : 'Try searching with a different name or email.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Course</th>
                  <th className="px-5 py-4">Enrollment Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.enrollmentId}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
                          {(student.studentName || 'S')
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="font-medium text-gray-900">
                            {student.studentName}
                          </p>

                          <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                            <Mail className="h-3 w-3" />
                            {student.studentEmail || 'Email unavailable'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-700">
                      {student.courseTitle}
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-500">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {student.enrolledAt
                          ? new Date(student.enrolledAt).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default InstructorStudents;

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Eye,
  EyeOff,
  GraduationCap,
  AlertCircle,
  CheckCircle,
  User,
  BookOpen,
  Award,
  Users,
} from 'lucide-react';
import authService from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useScrollToTop } from '../hooks/useCustomHooks';

const ROLES = [
  { value: 'student', label: 'Student', icon: User, desc: 'I want to learn' },
  { value: 'instructor', label: 'Instructor', icon: BookOpen, desc: 'I want to teach' },
];

const Register = () => {
  useScrollToTop();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [serverMsg, setServerMsg] = useState(null);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const onSubmit = async (data) => {
    setLoading(true);
    setServerMsg(null);
    try {
      const result = await authService.register({ ...data, role: selectedRole });
      if (result.user && result.session) {
        loginUser(result.user);
        setServerMsg({ type: 'success', text: result.message || 'Account created successfully!' });
        setTimeout(() => navigate('/'), 800);
      } else {
        setServerMsg({ type: 'success', text: result.message || 'Account created! Please check your email to confirm or sign in.' });
      }
    } catch (err) {
      setServerMsg({ type: 'error', text: err.message || 'Registration failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left Side: Brand Visual Illustration / Image */}
        <div className="relative hidden md:flex flex-col justify-between p-8 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />

          <div>
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center border border-white/20">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                LearnHub
              </span>
            </Link>

            <div className="mt-8">
              <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur text-xs font-semibold rounded-full border border-white/20 text-indigo-100 mb-3">
                Join our Global Learning Community
              </span>
              <h2 className="text-2xl font-extrabold leading-snug">
                Start learning with world-class mentors.
              </h2>
              <p className="text-sm text-indigo-100/90 mt-2">
                Create your account to unlock lifetime access to top courses, code reviews, and certificate programs.
              </p>
            </div>
          </div>

          {/* Featured LearnHub Banner Image */}
          <div className="my-4 relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl group">
            <img
              src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80"
              alt="Students collaborating at LearnHub"
              className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-4">
              <div className="text-xs">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  Recognized by Top Tech Companies
                </div>
                <div className="text-gray-200 text-[11px]">Upskill with practical hands-on projects</div>
              </div>
            </div>
          </div>

          {/* Quick perks */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-white/10">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-200 shrink-0" />
              <span>Full Video Curriculums</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-200 shrink-0" />
              <span>Community Support</span>
            </div>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <div className="text-center md:text-left mb-5">
            <div className="md:hidden flex justify-center mb-4">
              <Link to="/" className="inline-flex items-center gap-2">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-indigo-600">LearnHub</span>
              </Link>
            </div>

            <h1 className="text-2xl font-bold text-gray-900">
              Create your account
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Join millions of learners worldwide
            </p>
          </div>

          {serverMsg && (
            <div
              role="alert"
              className={`flex items-start gap-2 p-3 rounded-lg mb-4 text-sm ${
                serverMsg.type === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}
            >
              {serverMsg.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{serverMsg.text}</span>
            </div>
          )}

          {/* Role selection */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              I want to join as
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {ROLES.map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedRole(value)}
                  className={`flex items-center p-2.5 rounded-xl border-2 transition-all text-left gap-2 ${
                    selectedRole === value
                      ? 'border-indigo-600 bg-indigo-50/80 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      selectedRole === value ? 'text-indigo-600' : 'text-gray-400'
                    }`}
                  />
                  <div>
                    <div
                      className={`font-bold text-xs ${
                        selectedRole === value ? 'text-indigo-700' : 'text-gray-800'
                      }`}
                    >
                      {label}
                    </div>
                    <div className="text-[10px] text-gray-400">{desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Your full name"
                {...register('fullName', {
                  required: 'Full name is required',
                  minLength: { value: 2, message: 'Name too short' },
                })}
                className={`input-field text-sm ${
                  errors.fullName ? 'border-red-400' : ''
                }`}
              />
              {errors.fullName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+\.\S+$/,
                    message: 'Enter a valid email',
                  },
                })}
                className={`input-field text-sm ${
                  errors.email ? 'border-red-400' : ''
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'At least 6 characters required',
                    },
                  })}
                  className={`input-field pr-10 text-sm ${
                    errors.password ? 'border-red-400' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-gray-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-indigo-600 hover:underline font-bold"
            >
              Sign In
            </Link>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            <Link to="/" className="hover:text-gray-600">
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

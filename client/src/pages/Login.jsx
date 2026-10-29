import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Eye,
  EyeOff,
  GraduationCap,
  AlertCircle,
  CheckCircle,
  BookOpen,
  Award,
  Users,
} from 'lucide-react';
import authService from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useScrollToTop } from '../hooks/useCustomHooks';

const Login = () => {
  useScrollToTop();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverMsg, setServerMsg] = useState(null);

  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setServerMsg(null);

    try {
      const result = await authService.login(data);

      if (result.user) {
        loginUser(result.user);
      }

      setServerMsg({
        type: 'success',
        text: result.message || 'Login successful!',
      });

      // Redirect immediately to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (err) {
      setServerMsg({
        type: 'error',
        text: err.message || 'Login failed. Please try again.',
      });
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

            <div className="mt-10">
              <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur text-xs font-semibold rounded-full border border-white/20 text-indigo-100 mb-3">
                Online Learning Reimagined
              </span>
              <h2 className="text-2xl font-extrabold leading-snug">
                Welcome back to your learning space.
              </h2>
              <p className="text-sm text-indigo-100/90 mt-2">
                Continue watching lectures, track your progress, and get industry certificates.
              </p>
            </div>
          </div>

          {/* Featured LearnHub Banner Image */}
          <div className="my-6 relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl group">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80"
              alt="LearnHub Education"
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-4">
              <div className="text-xs">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  Over 10,000+ Verified Students
                </div>
                <div className="text-gray-200 text-[11px]">Empowering skills for modern careers</div>
              </div>
            </div>
          </div>

          {/* Quick perks */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-white/10">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-200 shrink-0" />
              <span>500+ Top Courses</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-200 shrink-0" />
              <span>Expert Mentorship</span>
            </div>
          </div>
        </div>

        {/* Right Side: Sign-in Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <div className="text-center md:text-left mb-6">
            <div className="md:hidden flex justify-center mb-4">
              <Link to="/" className="inline-flex items-center gap-2">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-indigo-600">LearnHub</span>
              </Link>
            </div>

            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Sign in to continue learning
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
              {serverMsg.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{serverMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
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
                  placeholder="Your password"
                  autoComplete="current-password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  className={`input-field pr-10 text-sm ${
                    errors.password ? 'border-red-400' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-indigo-600 rounded" />
                <span className="text-gray-600">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-indigo-600 hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-indigo-600 hover:underline font-bold"
            >
              Sign up for free
            </Link>
          </div>

          <p className="text-center text-xs text-gray-400 mt-5">
            <Link to="/" className="hover:text-gray-600">
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

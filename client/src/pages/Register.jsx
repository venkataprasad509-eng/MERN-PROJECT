import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, GraduationCap, AlertCircle, CheckCircle, User, BookOpen } from 'lucide-react';
import authService from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useScrollToTop } from '../hooks/useCustomHooks';

const ROLES = [
  { value: 'student', label: 'Student', icon: User, desc: 'I want to learn and take courses' },
  { value: 'instructor', label: 'Instructor', icon: BookOpen, desc: 'I want to create and sell courses' },
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-indigo-600">LearnHub</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-6">Create your account</h1>
          <p className="text-gray-500 mt-1">Join millions of learners worldwide</p>
        </div>

        <div className="card p-8">
          {serverMsg && (
            <div className={`flex items-start gap-2 p-3 rounded-lg mb-4 text-sm ${serverMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
              {serverMsg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />}
              <span>{serverMsg.text}</span>
            </div>
          )}

          {/* Role selection */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">I want to join as</label>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map(({ value, label, icon: Icon, desc }) => (
                <button key={value} type="button" onClick={() => setSelectedRole(value)}
                  className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all text-left gap-2 ${selectedRole === value ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <Icon className={`w-6 h-6 ${selectedRole === value ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <div>
                    <div className={`font-semibold text-sm ${selectedRole === value ? 'text-indigo-700' : 'text-gray-700'}`}>{label}</div>
                    <div className="text-xs text-gray-500">{desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" placeholder="Your full name"
                {...register('fullName', { required: 'Full name is required', minLength: { value: 2, message: 'Name too short' } })}
                className={`input-field ${errors.fullName ? 'border-red-400' : ''}`} />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input type="email" placeholder="you@example.com"
                {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' } })}
                className={`input-field ${errors.email ? 'border-red-400' : ''}`} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder="At least 6 characters"
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'At least 6 characters required' } })}
                  className={`input-field pr-10 ${errors.password ? 'border-red-400' : ''}`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 text-base disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 hover:underline font-semibold">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

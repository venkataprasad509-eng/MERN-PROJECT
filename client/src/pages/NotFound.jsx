import { Link } from 'react-router-dom';
import { GraduationCap, Home, Search } from 'lucide-react';

const NotFound = () => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
    <div className="text-center">
      <div className="text-8xl font-extrabold text-indigo-200 mb-4">404</div>
      <GraduationCap className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Page Not Found</h1>
      <p className="text-gray-500 max-w-sm mx-auto mb-8">
        Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/" className="btn-primary flex items-center gap-2 justify-center">
          <Home className="w-4 h-4" /> Go Home
        </Link>
        <Link to="/courses" className="btn-secondary flex items-center gap-2 justify-center">
          <Search className="w-4 h-4" /> Browse Courses
        </Link>
      </div>
    </div>
  </div>
);

export default NotFound;

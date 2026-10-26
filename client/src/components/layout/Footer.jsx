import { Link } from 'react-router-dom';
import { GraduationCap, Mail, Globe, MessageSquare, Share2 } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8 mt-20">
      <div className="page-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">LearnHub</span>
            </Link>
            <p className="text-sm leading-relaxed mb-5 text-gray-400 max-w-xs">
              The world's leading online learning marketplace. Discover courses taught by expert instructors and advance your career.
            </p>
            <div className="flex gap-3">
              {[Globe, MessageSquare, Share2].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 bg-gray-800 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Explore</h4>
            <ul className="space-y-2.5 text-sm">
              {[['Courses', '/courses'], ['Categories', '/courses'], ['About Us', '/about'], ['Contact', '/contact']].map(([label, path]) => (
                <li key={label}><Link to={path} className="hover:text-white transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Student</h4>
            <ul className="space-y-2.5 text-sm">
              {[['Dashboard', '/dashboard'], ['My Courses', '/my-courses'], ['Wishlist', '/wishlist'], ['Cart', '/cart'], ['Profile', '/profile']].map(([label, path]) => (
                <li key={label}><Link to={path} className="hover:text-white transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Teach</h4>
            <ul className="space-y-2.5 text-sm">
              {[['Become Instructor', '/instructor'], ['Instructor Dashboard', '/instructor'], ['Create Course', '/instructor']].map(([label, path]) => (
                <li key={label}><Link to={path} className="hover:text-white transition-colors">{label}</Link></li>
              ))}
              <li>
                <a href="mailto:support@learnhub.dev" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© 2024 LearnHub. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Cookie Policy</a>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span>API Connected</span>
          </div>
        </div>

        {/* Dev notice */}
        <div className="mt-4 p-3 bg-amber-900/30 border border-amber-700/40 rounded-lg">
          <p className="text-xs text-amber-400 text-center">
            ⚠️ <strong>DEV MODE:</strong> This application uses in-memory mock data. No real database, authentication, or payment provider is connected.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

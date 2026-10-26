import { Link } from 'react-router-dom';
import { GraduationCap, Target, Heart, Globe, Users, Star } from 'lucide-react';

const About = () => (
  <div>
    {/* Hero */}
    <section className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white py-20">
      <div className="page-container text-center">
        <GraduationCap className="w-16 h-16 text-amber-400 mx-auto mb-4" />
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">About LearnHub</h1>
        <p className="text-indigo-200 text-xl max-w-2xl mx-auto">
          We're on a mission to make world-class education accessible to everyone, everywhere.
        </p>
      </div>
    </section>

    {/* Mission */}
    <section className="py-16 bg-white">
      <div className="page-container max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { icon: Target, title: 'Our Mission', text: 'Democratize education by connecting passionate instructors with eager learners worldwide.' },
            { icon: Heart, title: 'Our Values', text: 'Quality, accessibility, inclusivity, and a genuine passion for lifelong learning.' },
            { icon: Globe, title: 'Our Impact', text: 'Serving 850,000+ students across 190+ countries with 12,000+ courses.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="p-6">
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon className="w-7 h-7 text-indigo-600" />
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">{title}</h3>
              <p className="text-gray-600">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Stats */}
    <section className="py-12 bg-indigo-50">
      <div className="page-container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '850K+', label: 'Students' },
            { value: '12,000+', label: 'Courses' },
            { value: '480+', label: 'Instructors' },
            { value: '190+', label: 'Countries' },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-4xl font-extrabold text-indigo-600 mb-1">{value}</div>
              <div className="text-gray-600">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Team */}
    <section className="py-16 bg-white">
      <div className="page-container text-center">
        <h2 className="section-title mb-2">Our Leadership Team</h2>
        <p className="section-subtitle mb-10">Passionate educators and technologists driving our mission</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { name: 'Arjun Mehta', role: 'CEO & Co-Founder', avatar: 'https://i.pravatar.cc/150?img=50' },
            { name: 'Priya Sharma', role: 'CTO & Co-Founder', avatar: 'https://i.pravatar.cc/150?img=47' },
            { name: 'Rahul Nair', role: 'Head of Content', avatar: 'https://i.pravatar.cc/150?img=52' },
          ].map((m) => (
            <div key={m.name} className="card p-6 text-center">
              <img src={m.avatar} alt={m.name} className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-4 border-indigo-100" />
              <h3 className="font-bold text-gray-900">{m.name}</h3>
              <p className="text-sm text-indigo-600">{m.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center">
      <div className="page-container">
        <h2 className="text-3xl font-bold mb-4">Join the Learning Revolution</h2>
        <p className="text-indigo-200 mb-8 max-w-xl mx-auto">Become part of our growing community of learners and instructors.</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/register" className="bg-white text-indigo-600 font-bold px-8 py-3 rounded-xl hover:bg-indigo-50 transition-colors">Get Started Free</Link>
          <Link to="/courses" className="border-2 border-white text-white font-bold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors">Browse Courses</Link>
        </div>
      </div>
    </section>
  </div>
);

export default About;

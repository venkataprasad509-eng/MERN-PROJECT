import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Camera, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from '../utils/toast';
import { useScrollToTop } from '../hooks/useCustomHooks';

const Profile = () => {
  useScrollToTop();
  const { user, devSwitchRole } = useAuth();
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: user?.name || '', email: user?.email || '', bio: 'Passionate learner and developer.', phone: '+91 98765 43210', website: 'https://example.com', location: 'Bangalore, India' }
  });

  const onSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success('Profile updated! (Demo — changes are not persisted)');
  };

  return (
    <div className="page-container py-10 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

      {/* Tab nav */}
      <div className="flex gap-4 border-b border-gray-200 mb-8">
        {['profile', 'security', 'notifications'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`capitalize pb-3 font-semibold text-sm border-b-2 transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <form onSubmit={handleSubmit(onSave)} className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <img src={user?.avatar} alt={user?.name} className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100" />
              <button type="button" className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-700 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">{user?.name}</h2>
              <p className="text-gray-500 text-sm capitalize">{user?.role}</p>
              <div className="flex gap-2 mt-2">
                {['student', 'instructor', 'admin'].map((r) => (
                  <button key={r} type="button" onClick={() => devSwitchRole(r)}
                    className={`text-xs px-2 py-1 rounded border capitalize transition-colors ${user?.role === r ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:border-indigo-400'}`}>
                    {r}
                  </button>
                ))}
              </div>
              <p className="text-xs text-amber-600 mt-1">⚠️ DEV: Switch Role</p>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h3 className="font-bold text-gray-900">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input {...register('name', { required: true })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input {...register('email')} className="input-field" readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input {...register('phone')} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input {...register('location')} className="input-field" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea {...register('bio')} rows={3} className="input-field resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input {...register('website')} type="url" className="input-field" />
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs text-amber-600">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>DEV MODE: Profile changes are not persisted to any database.</span>
            </div>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
              <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {tab === 'security' && (
        <div className="card p-6 space-y-4">
          <h3 className="font-bold text-gray-900">Change Password</h3>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>DEV MODE: Password changes are not implemented. No real authentication is connected.</span>
          </div>
          <div className="space-y-3 opacity-50 pointer-events-none">
            {['Current Password', 'New Password', 'Confirm New Password'].map((l) => (
              <div key={l}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
                <input type="password" className="input-field" disabled />
              </div>
            ))}
            <button className="btn-primary opacity-50" disabled>Update Password</button>
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">Notification Preferences</h3>
          <div className="space-y-4">
            {[
              ['Course updates & new content', true],
              ['Promotional offers & discounts', true],
              ['Review replies & interactions', false],
              ['Weekly learning reminders', true],
              ['New course recommendations', false],
            ].map(([label, def]) => (
              <label key={label} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700">{label}</span>
                <input type="checkbox" defaultChecked={def} className="accent-indigo-600 w-4 h-4" />
              </label>
            ))}
          </div>
          <button onClick={() => toast.success('Preferences saved (demo)')} className="btn-primary mt-5">Save Preferences</button>
        </div>
      )}
    </div>
  );
};

export default Profile;

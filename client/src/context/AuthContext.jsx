
import { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../services/supabase';

const AuthContext = createContext(null);

const formatUser = (supabaseUser, profile = null) => {
  if (!supabaseUser) return null;

  const meta = supabaseUser.user_metadata || {};
  const email = supabaseUser.email || '';

  const name =
    profile?.full_name ||
    meta.full_name ||
    meta.name ||
    email.split('@')[0] ||
    'User';

  return {
    id: supabaseUser.id,
    email: profile?.email || email,
    name,
    // Read the actual role from the profiles table first.
    role: profile?.role || meta.role || 'student',
    avatar:
      meta.avatar_url ||
      meta.avatar ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    ...meta,
    // Keep the database role even if metadata contains another role.
    role: profile?.role || meta.role || 'student',
  };
};

// Fetch the user's actual profile and role from Supabase.
const getFormattedUser = async (supabaseUser) => {
  if (!supabaseUser?.id) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('id', supabaseUser.id)
    .maybeSingle();

  if (error) {
    console.error('Could not fetch user profile:', error.message);
  }

  return formatUser(supabaseUser, profile);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (session?.user) {
          const formatted = await getFormattedUser(session.user);

          if (active) setUser(formatted);
        } else {
          const saved = localStorage.getItem('demo_user');

          if (active && saved) {
            try {
              setUser(JSON.parse(saved));
            } catch {
              setUser(null);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching auth session:', err.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        localStorage.removeItem('demo_user');
        localStorage.setItem('demo_session_id', session.user.id);

        // Fetch the database role after the auth event.
        Promise.resolve().then(async () => {
          const formatted = await getFormattedUser(session.user);

          if (active) setUser(formatted);
          if (active) setLoading(false);
        });
      } else {
        const saved = localStorage.getItem('demo_user');

        if (active) {
          if (saved) {
            try {
              setUser(JSON.parse(saved));
            } catch {
              setUser(null);
            }
          } else {
            setUser(null);
          }

          setLoading(false);
        }
      }
    });

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  const loginUser = (supabaseUser) => {
    const formatted = formatUser(supabaseUser);
    setUser(formatted);

    // Refresh the role from the database.
    getFormattedUser(supabaseUser).then((updatedUser) => {
      if (updatedUser) setUser(updatedUser);
    });

    return formatted;
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Logout error:', error.message);
    } catch (err) {
      console.error('Logout error:', err.message);
    }

    setUser(null);
    localStorage.removeItem('demo_user');
    localStorage.removeItem('demo_session_id');
  };

  const devSwitchRole = (role) => {
    const demoUser = {
      id: `demo-${role}`,
      name:
        role === 'student'
          ? 'Priya Sharma'
          : role === 'instructor'
            ? 'Dr. Angela Yu'
            : 'Admin User',
      email: `${role}@demo.dev`,
      role,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${role}`,
    };

    setUser(demoUser);
    localStorage.setItem('demo_user', JSON.stringify(demoUser));
    localStorage.setItem('demo_session_id', `demo-session-${role}`);
  };

  const isAuthenticated = !!user;
  const isStudent = user?.role === 'student';
  const isInstructor = user?.role === 'instructor';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isStudent,
        isInstructor,
        isAdmin,
        loginUser,
        logout,
        devSwitchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return ctx;
};

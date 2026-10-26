
import supabase from "./supabase";

const authService = {
  async register({ fullName, email, password, role }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (error) throw error;

    return {
      user: data.user,
      session: data.session,
      message: data.session
        ? "Account created successfully!"
        : "Account created. Check your email to confirm your account.",
    };
  },

  // UPDATED LOGIN FUNCTION
  async login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return {
      ...data,
      message: "Login successful!",
    };
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    return {
      success: true,
      message: "Logged out successfully.",
    };
  },

  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;

    return data.user;
  },

  async forgotPassword({ email }) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;

    return {
      success: true,
      message: "If the account exists, a password-reset email will be sent.",
    };
  },
};

export default authService;

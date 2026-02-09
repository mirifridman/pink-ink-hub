import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  theme_preference: string | null;
  email_notifications: boolean | null;
  push_notifications: boolean | null;
  language: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data as Profile;
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    // Set up auth state listener BEFORE getting session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to avoid potential deadlock with Supabase client
          setTimeout(async () => {
            const profileData = await fetchProfile(session.user.id);
            setProfile(profileData);
          }, 0);
        } else {
          setProfile(null);
        }

        setIsLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
      }
      setIsLoading(false);
    });

    // Handle session cleanup when browser closes (for non-remembered sessions)
    const handleBeforeUnload = () => {
      const rememberMe = localStorage.getItem('rememberMe');
      if (!rememberMe) {
        // Clear session data from localStorage when browser closes
        // This effectively logs out users who didn't select "remember me"
        localStorage.removeItem('sb-wphtinxfspycdlbcdgqu-auth-token');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const signIn = async (email: string, password: string, rememberMe: boolean = false): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.session) {
      // Store preference for session persistence
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
        // Session will be cleared when browser closes via beforeunload
      }
    }

    if (error) {
      // Translate common errors to Hebrew
      const errorMessages: Record<string, string> = {
        'Invalid login credentials': 'אימייל או סיסמה שגויים',
        'Email not confirmed': 'האימייל לא אומת. בדוק את תיבת הדואר שלך',
        'Too many requests': 'יותר מדי ניסיונות. נסה שוב מאוחר יותר',
      };
      return { error: errorMessages[error.message] || error.message };
    }

    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      const errorMessages: Record<string, string> = {
        'User already registered': 'משתמש עם אימייל זה כבר קיים',
        'Password should be at least 6 characters': 'הסיסמה חייבת להכיל לפחות 6 תווים',
        'Signup requires a valid password': 'נדרשת סיסמה תקינה',
      };
      return { error: errorMessages[error.message] || error.message };
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

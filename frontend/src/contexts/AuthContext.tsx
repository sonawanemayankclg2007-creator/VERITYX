import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  timezone: string;
  user_category?: 'Student' | 'Employee' | 'Unemployed';
  target_interests?: string[];
  education_level?: string;
  skills?: string[];
  notification_preferences: {
    email: boolean;
    push: boolean;
    in_app: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null; user: User | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, userEmail: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Profile fetch note:', error.message);
      }

      const rawMeta = user?.user_metadata || {};
      const savedCat = rawMeta.user_category || (data as any)?.user_category || localStorage.getItem(`verityx_cat_${userId}`) || 'Student';
      const savedInterests = rawMeta.target_interests || (data as any)?.target_interests || JSON.parse(localStorage.getItem(`verityx_interests_${userId}`) || '["Competitive Exams", "Scholarships"]');
      const savedEdu = rawMeta.education_level || (data as any)?.education_level || localStorage.getItem(`verityx_edu_${userId}`) || 'Undergraduate / College';
      const savedSkills = rawMeta.skills || (data as any)?.skills || JSON.parse(localStorage.getItem(`verityx_skills_${userId}`) || '["Coding", "Problem Solving"]');

      if (data) {
        setProfile({
          ...data,
          user_category: savedCat,
          target_interests: savedInterests,
          education_level: savedEdu,
          skills: savedSkills,
        } as UserProfile);
      } else {
        // Automatically ensure user profile exists in public.profiles table
        const rawName = user?.user_metadata?.full_name || user?.user_metadata?.name || userEmail.split('@')[0];
        const rawUsername = user?.user_metadata?.username || userEmail.split('@')[0] + '_' + Math.random().toString(36).substring(2, 6);
        const rawAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

        const initialProfile: UserProfile = {
          id: userId,
          email: userEmail,
          full_name: rawName,
          username: rawUsername,
          avatar_url: rawAvatar,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
          user_category: savedCat,
          target_interests: savedInterests,
          education_level: savedEdu,
          skills: savedSkills,
          notification_preferences: { email: true, push: true, in_app: true },
        };

        const { data: insertedData, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: userEmail,
            full_name: rawName,
            username: rawUsername,
            avatar_url: rawAvatar,
            timezone: initialProfile.timezone,
            notification_preferences: initialProfile.notification_preferences,
          })
          .select()
          .maybeSingle();

        if (insertedData) {
          setProfile({ ...insertedData, ...initialProfile } as UserProfile);
        } else {
          if (insertError) console.warn('Profile insert note:', insertError.message);
          setProfile(initialProfile);
        }
      }
    } catch (err) {
      console.warn('Profile sync exception:', err);
    }
  };

  useEffect(() => {
    // 1. Initial session load
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        fetchProfile(initialSession.user.id, initialSession.user.email || '');
      }
      setLoading(false);
    });

    // 2. Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await fetchProfile(newSession.user.id, newSession.user.email || '');
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const res = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (res.data.user && !res.error) {
      // Optimistically create/cache profile
      setProfile({
        id: res.data.user.id,
        email,
        full_name: fullName,
        username: email.split('@')[0],
        avatar_url: null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        notification_preferences: { email: true, push: true, in_app: true },
      });
    }

    return { error: res.error, user: res.data.user };
  };

  const signIn = async (email: string, password: string) => {
    const res = await supabase.auth.signInWithPassword({ email, password });
    return { error: res.error };
  };

  const signInWithGoogle = async () => {
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('User not logged in') };
    try {
      // 1. Try public.profiles table update
      try {
        await supabase
          .from('profiles')
          .update({
            full_name: updates.full_name,
            username: updates.username,
            avatar_url: updates.avatar_url,
            timezone: updates.timezone,
            notification_preferences: updates.notification_preferences,
          })
          .eq('id', user.id);
      } catch (dbErr) {
        console.warn('DB profile update note:', dbErr);
      }

      // 2. Persist in Supabase Auth user_metadata
      try {
        await supabase.auth.updateUser({
          data: {
            user_category: updates.user_category,
            target_interests: updates.target_interests,
            education_level: updates.education_level,
            skills: updates.skills,
            full_name: updates.full_name,
          }
        });
      } catch (metaErr) {
        console.warn('Auth metadata update note:', metaErr);
      }

      // 3. Local fallback persistence
      if (updates.user_category) localStorage.setItem(`verityx_cat_${user.id}`, updates.user_category);
      if (updates.target_interests) localStorage.setItem(`verityx_interests_${user.id}`, JSON.stringify(updates.target_interests));
      if (updates.education_level) localStorage.setItem(`verityx_edu_${user.id}`, updates.education_level);
      if (updates.skills) localStorage.setItem(`verityx_skills_${user.id}`, JSON.stringify(updates.skills));

      if (profile) {
        setProfile({ ...profile, ...updates });
      }
      return { error: null };
    } catch (err: any) {
      if (profile) setProfile({ ...profile, ...updates });
      return { error: err };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email || '');
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


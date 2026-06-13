import React, { useEffect, useState, createContext, useContext } from 'react';
import { View, ActivityIndicator, Text, TouchableWithoutFeedback } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { useIdleTimer } from '../hooks/security';

// Auth Context for easy access across components
type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Hook to access auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();
  const { resetIdleTimer } = useIdleTimer();

  // Check initial session and listen for changes
  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      if (mounted) {
        setSession(initialSession);
        setIsLoading(false);
      }
    }

    getInitialSession();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isLoading) return;

    const isAuthRoute = segments[0] === 'auth';
    const isLoggedIn = !!session;

    if (!isLoggedIn && !isAuthRoute) {
      // Redirect to auth screen if not logged in and not on auth route
      router.replace('/auth');
    } else if (isLoggedIn && isAuthRoute) {
      // Redirect to tabs if logged in and on auth route
      router.replace('/(tabs)');
    }
  }, [session, isLoading, segments, router]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Show loading while checking session
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950">
        <ActivityIndicator size="large" color="#06B6D4" />
        <Text className="text-zinc-400 mt-4 text-sm">Loading shopX...</Text>
      </View>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isLoading,
        signOut,
      }}
    >
      <TouchableWithoutFeedback onPress={resetIdleTimer} accessible={false}>
        <View className="flex-1">
          <Slot />
        </View>
      </TouchableWithoutFeedback>
    </AuthContext.Provider>
  );
}

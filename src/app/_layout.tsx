import React, { useEffect, useState, createContext, useContext } from 'react';
import { View, ActivityIndicator, Text, TouchableWithoutFeedback } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { useIdleTimer } from '../hooks/security';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { NoInternet } from '../components/NoInternet';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import "../styles/global.css";

function InnerApp() {
  const { resetIdleTimer } = useIdleTimer();
  return (
    <SafeAreaProvider>
      <NoInternet />
      <TouchableWithoutFeedback onPress={resetIdleTimer} accessible={false}>
        <View className="flex-1 pt-8">
          <Slot />
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaProvider>
  );
}

function AuthenticatedApp({ 
  session, 
  isLoading, 
  signOut 
}: { 
  session: Session | null; 
  isLoading: boolean; 
  signOut: () => Promise<void>; 
}) {
  const segments = useSegments();
  const router = useRouter();

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

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isLoading,
        signOut,
      }}
    >
      <InnerApp />
    </AuthContext.Provider>
  );
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    <ErrorBoundary>
      <AuthenticatedApp 
        session={session} 
        isLoading={isLoading} 
        signOut={signOut} 
      />
    </ErrorBoundary>
  );
}

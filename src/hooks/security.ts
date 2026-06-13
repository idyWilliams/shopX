import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../app/_layout';
import type { Profile } from '../types';

export function usePermissions() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    async function getProfile() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        setProfile(data);
        setIsAdmin(data?.role === 'owner');
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setIsLoading(false);
      }
    }

    getProfile();
  }, [user]);

  return {
    isAdmin,
    isLoading,
    profile,
  };
}

interface IdleTimerOptions {
  timeout?: number; // in seconds
}

export function useIdleTimer({ timeout = 300 }: IdleTimerOptions = {}) {
  const [isIdle, setIsIdle] = useState(false);
  const lastActivityRef = useRef(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { signOut } = useAuth();

  // Reset idle timer on user activity
  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIsIdle(false);
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set new timer
    timerRef.current = setTimeout(() => {
      handleIdle();
    }, timeout * 1000);
  }, [timeout]);

  const handleIdle = useCallback(() => {
    setIsIdle(true);
    // Sign out on idle
    signOut();
  }, [signOut]);

  useEffect(() => {
    // Start initial timer
    resetIdleTimer();

    // Listen to app state changes
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // App is active again
        resetIdleTimer();
      } else if (nextAppState === 'background') {
        // App is going to background
        // Reset timer to start from 0 when coming back
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      }
    });

    return () => {
      subscription.remove();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [resetIdleTimer]);

  return {
    isIdle,
    resetIdleTimer,
  };
}

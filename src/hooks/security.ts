import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AppState, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../app/_layout';
import type { Profile, Organization } from '../types';

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
        // Mock profile data for now
        setProfile({
          id: 'mock-profile-id',
          user_id: user.id,
          org_id: 'mock-org-id',
          role: 'owner',
          name: 'John Doe',
          referral_code: 'ABC123'
        });
        setIsAdmin(true);
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

export function useSubscription() {
  const [isLoading, setIsLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const { user } = useAuth();
  const { profile } = usePermissions();

  const isInTrial = useMemo(() => {
    if (!organization?.created_at) return false;
    const createdAt = new Date(organization.created_at);
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays < 7;
  }, [organization?.created_at]);

  const hasProAccess = useMemo(() => {
    if (!organization) return false;
    
    // Check if explicitly pro
    if (organization.is_pro) return true;
    
    // Check trial
    if (isInTrial) return true;
    
    // Check pro expiry date
    if (organization.pro_expiry_date) {
      const expiry = new Date(organization.pro_expiry_date);
      const now = new Date();
      return now < expiry;
    }
    
    return false;
  }, [isInTrial, organization]);

  useEffect(() => {
    async function fetchOrganization() {
      if (!profile?.org_id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Mock data for now
        setOrganization({
          id: profile.org_id,
          name: 'Fashion Haven Ltd',
          tier: 'premium',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago for trial
          is_pro: false,
          pro_expiry_date: null
        });
      } catch (error) {
        console.error('Error fetching organization:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrganization();
  }, [profile?.org_id]);

  return {
    isLoading,
    organization,
    isInTrial,
    hasProAccess,
  };
}

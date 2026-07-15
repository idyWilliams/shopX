import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AppState, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Profile, Organization, UserRole } from '../types';

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
        
        // Attempt to fetch as merchant (owner)
        const { data: merchantData, error: merchantError } = await supabase
          .from('merchants')
          .select('*')
          .eq('id', user.id)
          .single();

        if (merchantData) {
          setProfile({
            id: merchantData.id,
            user_id: user.id,
            org_id: merchantData.id,
            role: 'owner',
            name: merchantData.email || 'Owner',
            referral_code: 'N/A'
          });
          setIsAdmin(true);
          return;
        }

        // Attempt to fetch as attendant
        const { data: attendantData, error: attendantError } = await supabase
          .from('attendants')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (attendantData) {
           setProfile({
            id: attendantData.id,
            user_id: user.id,
            org_id: 'unknown',
            role: attendantData.access_level as UserRole,
            name: attendantData.name,
            referral_code: 'N/A'
          });
          setIsAdmin(attendantData.access_level === 'admin');
        }
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
        
        // Since there is no dedicated organization table in schema, we map stores/merchants
        // If there are real billing records in the future, fetch them here.
        const { data: stores, error } = await supabase
          .from('stores')
          .select('*')
          .eq('merchant_id', profile.org_id)
          .limit(1);

        if (stores && stores.length > 0) {
          const store = stores[0];
          setOrganization({
            id: profile.org_id,
            name: store.name,
            tier: 'premium', // Defaulting to premium for MVP
            created_at: store.created_at,
            is_pro: true,
            pro_expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });
        }
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

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Simplified types for disabled WatermelonDB
type SimpleStore = { 
  id: string; 
  name: string; 
  merchantId: string; 
  locationAddress?: string; 
  category?: string;
  location_address?: string; // for Supabase compatibility
};
type SimpleAttendant = { id: string; name: string };
type SimpleMerchant = { id: string; name: string };

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  activeStoreId: string | null;
  setActiveStoreId: (storeId: string | null) => void;
  authorizedStores: SimpleStore[];
  setAuthorizedStores: (stores: SimpleStore[]) => void;
  currentAttendant: SimpleAttendant | null;
  setCurrentAttendant: (attendant: SimpleAttendant | null) => void;
  soloOwner: boolean;
  setSoloOwner: (solo: boolean) => void;
  currentMerchant: SimpleMerchant | null;
  hasLoadedStores: boolean;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (completed: boolean) => Promise<void>;
  loadAllStoresForOwner: (merchantId: string) => Promise<void>;
  loadAuthorizedStoresForAttendant: (attendantId: string) => Promise<void>;
  createDefaultStore: (merchantId: string, storeName?: string, category?: string, logo?: string) => Promise<SimpleStore>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  activeStoreId: null,
  setActiveStoreId: () => {},
  authorizedStores: [],
  setAuthorizedStores: () => {},
  currentAttendant: null,
  setCurrentAttendant: () => {},
  soloOwner: true,
  setSoloOwner: () => {},
  currentMerchant: null,
  hasLoadedStores: false,
  hasCompletedOnboarding: false,
  setHasCompletedOnboarding: async () => {},
  loadAllStoresForOwner: async () => {},
  loadAuthorizedStoresForAttendant: async () => {},
  createDefaultStore: async () => { throw new Error('Not implemented'); },
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
  const [authorizedStores, setAuthorizedStores] = useState<SimpleStore[]>([]);
  const [currentAttendant, setCurrentAttendant] = useState<SimpleAttendant | null>(null);
  const [soloOwner, setSoloOwner] = useState(true);
  const [currentMerchant, setCurrentMerchant] = useState<SimpleMerchant | null>(null);
  const [hasLoadedStores, setHasLoadedStores] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboardingState] = useState(false);

  const setHasCompletedOnboarding = async (completed: boolean) => {
    try {
      if (completed) {
        await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      } else {
        await AsyncStorage.removeItem('hasCompletedOnboarding');
      }
      setHasCompletedOnboardingState(completed);
    } catch (err) {
      console.error('Failed to update onboarding state:', err);
    }
  };

  const loadOnboardingState = async () => {
    try {
      const value = await AsyncStorage.getItem('hasCompletedOnboarding');
      setHasCompletedOnboardingState(value === 'true');
    } catch (err) {
      console.error('Failed to load onboarding state:', err);
    }
  };

  useEffect(() => {
    loadOnboardingState();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const createDefaultStore = async (merchantId: string, storeName?: string, category?: string, _logo?: string): Promise<SimpleStore> => {
    // Create a merchant record if it doesn't exist
    const { error: merchantError } = await supabase
      .from('merchants')
      .upsert({ id: merchantId, email: user?.email || '' })
      .select()
      .single();

    if (merchantError && merchantError.code !== '23505' && merchantError.code !== 'PGRST205') {
      console.error('Error creating merchant:', merchantError);
    }

    const { data, error } = await supabase
      .from('stores')
      .insert({ merchant_id: merchantId, name: storeName || 'Default Shop', category: category || 'Retail' })
      .select()
      .single();

    if (error) {
      if (error.code !== 'PGRST205') {
        console.error('Error creating default store:', error);
      }
      return {
        id: `local-store-${merchantId}`,
        name: storeName || 'Default Shop',
        merchantId,
        category: category || 'Retail',
      };
    }

    return {
      id: data.id,
      name: data.name,
      merchantId: data.merchant_id,
      category: data.category,
      locationAddress: data.location_address,
      location_address: data.location_address,
    };
  };

  const loadAllStoresForOwner = async (merchantId: string) => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('merchant_id', merchantId);

      if (error) throw error;

      let stores = data || [];

      const formattedStores = stores.map((s: any) => ({
        id: s.id,
        name: s.name,
        merchantId: s.merchant_id || s.merchantId,
        category: s.category,
        locationAddress: s.location_address || s.locationAddress,
        location_address: s.location_address || s.locationAddress,
      }));

      setAuthorizedStores(formattedStores);
      if (formattedStores.length > 0) {
        setActiveStoreId(formattedStores[0].id);
      }
    } catch (err) {
      const errorCode = (err as { code?: string } | null)?.code;
      if (errorCode !== 'PGRST205') {
        console.error('Failed to load stores for owner:', err);
      }
      const fallbackStore: SimpleStore = {
        id: `local-store-${merchantId}`,
        name: 'Default Shop',
        merchantId,
      };
      setAuthorizedStores([fallbackStore]);
      setActiveStoreId(fallbackStore.id);
    } finally {
      setHasLoadedStores(true);
    }
  };

  const loadAuthorizedStoresForAttendant = async (attendantId: string) => {
    try {
      const { data, error } = await supabase
        .from('store_attendants')
        .select(`
          stores (
            id,
            name,
            merchant_id
          )
        `)
        .eq('attendant_id', attendantId);

      if (error) throw error;

      if (data) {
        const stores = data
          .map((d: any) => d.stores)
          .filter(Boolean)
          .map((s: any) => ({
            id: s.id,
            name: s.name,
            merchantId: s.merchant_id,
          }));
        
        setAuthorizedStores(stores);
      }
    } catch (err) {
      console.error('Failed to load stores for attendant:', err);
    } finally {
      setHasLoadedStores(true);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setActiveStoreId(null);
    setAuthorizedStores([]);
    setCurrentAttendant(null);
    setSoloOwner(true);
    setCurrentMerchant(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      activeStoreId, 
      setActiveStoreId, 
      authorizedStores,
      setAuthorizedStores,
      currentAttendant,
      setCurrentAttendant,
      soloOwner,
      setSoloOwner,
      currentMerchant,
      hasLoadedStores,
      hasCompletedOnboarding,
      setHasCompletedOnboarding,
      loadAllStoresForOwner,
      loadAuthorizedStoresForAttendant,
      createDefaultStore,
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

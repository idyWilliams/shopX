import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { database } from '../db';
import { Store } from '../db/models/Store';
import { Attendant } from '../db/models/Attendant';
import { StoreAttendant } from '../db/models/StoreAttendant';
import { Merchant } from '../db/models/Merchant';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  activeStoreId: string | null;
  setActiveStoreId: (storeId: string | null) => void;
  authorizedStores: Store[];
  setAuthorizedStores: (stores: Store[]) => void;
  currentAttendant: Attendant | null;
  setCurrentAttendant: (attendant: Attendant | null) => void;
  soloOwner: boolean;
  setSoloOwner: (solo: boolean) => void;
  currentMerchant: Merchant | null;
  loadAllStoresForOwner: (merchantId: string) => Promise<void>;
  loadAuthorizedStoresForAttendant: (attendantId: string) => Promise<void>;
  createDefaultStore: (merchantId: string) => Promise<Store>;
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
  const [authorizedStores, setAuthorizedStores] = useState<Store[]>([]);
  const [currentAttendant, setCurrentAttendant] = useState<Attendant | null>(null);
  const [soloOwner, setSoloOwner] = useState(true);
  const [currentMerchant, setCurrentMerchant] = useState<Merchant | null>(null);

  useEffect(() => {
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

  const createDefaultStore = async (merchantId: string): Promise<Store> => {
    let store: Store;
    await database.write(async () => {
      store = await database.get<Store>('stores').create(s => {
        s.merchantId = merchantId;
        s.name = 'Default Shop';
      });
    });
    return store!;
  };

  const loadAllStoresForOwner = async (merchantId: string) => {
    const allStores = await database.get<Store>('stores').query().fetch();
    const ownerStores = allStores.filter(s => s.merchantId === merchantId);
    
    if (ownerStores.length === 0) {
      const defaultStore = await createDefaultStore(merchantId);
      setAuthorizedStores([defaultStore]);
      setActiveStoreId(defaultStore.id);
    } else {
      setAuthorizedStores(ownerStores);
      setActiveStoreId(ownerStores[0].id);
    }
  };

  const loadAuthorizedStoresForAttendant = async (attendantId: string) => {
    // Get all store_attendant relationships for this attendant
    const storeAttendants = await database
      .get<StoreAttendant>('store_attendants')
      .query()
      .fetch();

    const storeIds = storeAttendants
      .filter(sa => sa.attendantId === attendantId)
      .map(sa => sa.storeId);

    // Get all stores
    const allStores = await database.get<Store>('stores').query().fetch();
    const authorized = allStores.filter(s => storeIds.includes(s.id));
    setAuthorizedStores(authorized);
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
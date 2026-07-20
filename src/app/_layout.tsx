import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import '../styles/global.css';
import { checkDeviceAuthorization } from '../lib/deviceGuard';
import '../lib/config'; // Validate API keys on app start
import { syncData } from '../lib/sync';
import TerminalUnauthorizedScreen from '../components/TerminalUnauthorizedScreen';

function RootLayoutNav() {
  const { 
    session, 
    loading, 
    activeStoreId, 
    authorizedStores, 
    currentAttendant, 
    soloOwner,
    hasLoadedStores,
    loadAllStoresForOwner,
    setActiveStoreId,
    setAuthorizedStores,
    setSoloOwner
  } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [deviceChecked, setDeviceChecked] = useState<boolean>(false);
  const [isDeviceAuthorized, setIsDeviceAuthorized] = useState<boolean>(true);

  useEffect(() => {
    const checkDevice = async () => {
      try {
        // Only check device authorization if NOT in solo-owner mode (or after we have a session)
        // For now, skip strict device checks until we have a user session
        setIsDeviceAuthorized(true);
      } catch (error) {
        console.error('Device authorization error:', error);
        setIsDeviceAuthorized(false);
      } finally {
        setDeviceChecked(true);
      }
    };

    checkDevice();

    // Start background sync every 5 minutes
    const syncInterval = setInterval(() => {
      syncData();
    }, 5 * 60 * 1000);

    return () => clearInterval(syncInterval);
  }, []);

  useEffect(() => {
    if (loading || !deviceChecked) return;

    const inWelcome = segments[0] === 'welcome';
    const inAuthGroup = segments[0] === 'auth';
    const inSelectShopGroup = segments[0] === 'select-shop';
    const inOnboarding = segments[0] === 'onboarding';

    if (!session && !inAuthGroup && !inOnboarding && !inWelcome) {
      router.replace('/welcome');
    } else if (session) {
      // For solo owner, always load owner's stores first
      if (soloOwner && !hasLoadedStores) {
        loadAllStoresForOwner(session.user.id);
        return; // wait for it to load
      }

      if (inAuthGroup || inWelcome) {
        if (soloOwner) {
          if (authorizedStores.length === 0) {
            router.replace('/onboarding');
          } else {
            router.replace('/(tabs)');
          }
        } else {
          // Check if we need to select a shop or go to tabs
          if (!activeStoreId && authorizedStores.length > 1) {
            router.replace('/select-shop');
          } else if (!activeStoreId && authorizedStores.length === 1) {
            // Auto-select the only store
            router.replace('/(tabs)');
          } else if (activeStoreId) {
            router.replace('/(tabs)');
          }
        }
      } else if (!inSelectShopGroup && !inOnboarding && !activeStoreId && authorizedStores.length > 1 && !soloOwner) {
        router.replace('/select-shop');
      } else if (soloOwner && authorizedStores.length === 0 && !inOnboarding) {
        // If they navigate away from onboarding without stores, push them back
        router.replace('/onboarding');
      }
    }
  }, [session, loading, segments, deviceChecked, activeStoreId, authorizedStores, soloOwner, hasLoadedStores]);

  if (loading || !deviceChecked) {
    return (
      <View className="flex-1 justify-center items-center bg-zinc-950">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!isDeviceAuthorized) {
    return <TerminalUnauthorizedScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
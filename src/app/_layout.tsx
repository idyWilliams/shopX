import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import '../styles/global.css';
import { checkDeviceAuthorization } from '../lib/deviceGuard';
import '../lib/config'; // Validate API keys on app start
import TerminalUnauthorizedScreen from '../components/TerminalUnauthorizedScreen';

function RootLayoutNav() {
  const { 
    session, 
    loading, 
    activeStoreId, 
    authorizedStores, 
    currentAttendant, 
    soloOwner,
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
  }, []);

  useEffect(() => {
    if (loading || !deviceChecked) return;

    const inAuthGroup = segments[0] === 'auth';
    const inSelectShopGroup = segments[0] === 'select-shop';
    const inOnboarding = segments[0] === 'onboarding';

    if (!session && !inAuthGroup && !inOnboarding) {
      router.replace('/auth');
    } else if (session) {
      // For solo owner, always load owner's stores first
      if (soloOwner && authorizedStores.length === 0) {
        // Load all stores for owner (which creates default if none)
        loadAllStoresForOwner(session.user.id);
      }

      if (inAuthGroup) {
        if (soloOwner) {
          // Bypass select shop and PIN for solo owner
          router.replace('/(tabs)');
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
      }
    }
  }, [session, loading, segments, deviceChecked, activeStoreId, authorizedStores, soloOwner]);

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
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="select-shop" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
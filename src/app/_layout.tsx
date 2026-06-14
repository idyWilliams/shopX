import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import '../styles/global.css';
import { checkDeviceAuthorization } from '../lib/deviceGuard';
import '../lib/config'; // Validate API keys on app start
import TerminalUnauthorizedScreen from '../components/TerminalUnauthorizedScreen';

function RootLayoutNav() {
  const { session, loading, activeStoreId, authorizedStores, currentAttendant } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [deviceChecked, setDeviceChecked] = useState<boolean>(false);
  const [isDeviceAuthorized, setIsDeviceAuthorized] = useState<boolean>(true);

  useEffect(() => {
    const checkDevice = async () => {
      try {
        const authorized = await checkDeviceAuthorization();
        setIsDeviceAuthorized(authorized);
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
      if (inAuthGroup) {
        // Check if we need to select a shop or go to tabs
        if (!activeStoreId && authorizedStores.length > 1) {
          router.replace('/select-shop');
        } else if (!activeStoreId && authorizedStores.length === 1) {
          // Auto-select the only store
          router.replace('/(tabs)');
        } else if (activeStoreId) {
          router.replace('/(tabs)');
        }
      } else if (!inSelectShopGroup && !inOnboarding && !activeStoreId && authorizedStores.length > 1) {
        router.replace('/select-shop');
      }
    }
  }, [session, loading, segments, deviceChecked, activeStoreId, authorizedStores]);

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
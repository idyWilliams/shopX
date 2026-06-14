import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import '../styles/global.css';
import { checkDeviceAuthorization } from '../lib/deviceGuard';
import TerminalUnauthorizedScreen from '../components/TerminalUnauthorizedScreen';

function RootLayoutNav() {
  const { session, loading } = useAuth();
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
    if (loading || !deviceChecked === false) return;
    const inAuthGroup = segments[0] === 'auth';

    if (!session && !inAuthGroup) {
      router.replace('/auth');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments, deviceChecked]);

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
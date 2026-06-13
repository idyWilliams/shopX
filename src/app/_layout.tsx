import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import '../styles/global.css';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <View className="flex-1 bg-gray-900">
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#1F2937' },
            headerTintColor: '#F9FAFB',
            headerTitleStyle: { fontWeight: '600' },
            contentStyle: { backgroundColor: '#111827' },
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="index"
            options={{
              title: 'shopX',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="capture"
            options={{
              presentation: 'modal',
              title: 'Snap & Chat',
              headerStyle: { backgroundColor: '#1F2937' },
              headerTintColor: '#F9FAFB',
            }}
          />
          <Stack.Screen
            name="transfer"
            options={{
              presentation: 'modal',
              title: 'Transfer Stock',
              headerStyle: { backgroundColor: '#1F2937' },
              headerTintColor: '#F9FAFB',
            }}
          />
        </Stack>
      </View>
    </>
  );
}

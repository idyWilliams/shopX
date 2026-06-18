import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import React, { useState, useCallback } from 'react';
import { AppState } from 'react-native';
import AttendantPinLock from '../../components/AttendantPinLock';
import { useAuth } from '../../context/AuthContext';

const iconMap = {
  index: 'home',
  inventory: 'package',
  settings: 'settings',
} as const;

export default function TabLayout() {
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const { soloOwner, activeStoreId } = useAuth();

  const handleUnlock = useCallback(() => {
    setIsLocked(false);
  }, []);

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        setIsLocked(true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (isLocked && !soloOwner) {
    return <AttendantPinLock onUnlock={handleUnlock} storeId={activeStoreId!} />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#09090b',
          borderTopColor: '#27272a',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: '#71717a',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
        animation: 'shift', // Smooth like Apple Freeform
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Feather name={iconMap.index} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color, size }) => <Feather name={iconMap.inventory} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Feather name={iconMap.settings} color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

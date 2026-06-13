
import React, { useState, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';

// In a real app, we'd use @react-native-community/netinfo
// For now, let's simulate with a mock
export function NoInternet() {
  const [isOffline, setIsOffline] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  
  useEffect(() => {
    // Mock offline check
    const mockInterval = setInterval(() => {
      // Randomly toggle for demo purposes
      setIsOffline(Math.random() < 0.1);
    }, 30000);
    
    return () => clearInterval(mockInterval);
  }, []);
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isOffline ? 1 : 0,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, [isOffline, fadeAnim]);
  
  if (!isOffline) {
    return null;
  }
  
  return (
    <Animated.View
      style={{ opacity: fadeAnim }}
      className="absolute top-0 left-0 right-0 z-50 bg-amber-500 p-3 flex-row items-center justify-center gap-2"
    >
      <Feather name="wifi-off" size={16} color="#000000" />
      <Text className="text-xs font-semibold text-black">
        You are offline. Data will sync when back online.
      </Text>
    </Animated.View>
  );
}

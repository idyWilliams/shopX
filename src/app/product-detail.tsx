import React from 'react';
import { View, Text } from 'react-native';

export default function ProductDetailScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#09090b' }}>
      <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>Product Detail Screen</Text>
      <Text style={{ color: '#71717a', marginTop: 8, fontSize: 16 }}>Coming Soon!</Text>
    </View>
  );
}

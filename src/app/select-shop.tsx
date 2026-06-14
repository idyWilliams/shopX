import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function SelectShopScreen() {
  const { authorizedStores, setActiveStoreId } = useAuth();
  const router = useRouter();

  const handleSelectStore = (storeId: string) => {
    setActiveStoreId(storeId);
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your Store</Text>
      <Text style={styles.subtitle}>Choose which store you're working at today</Text>

      <ScrollView style={styles.storeList}>
        {authorizedStores.map((store) => (
          <TouchableOpacity
            key={store.id}
            style={styles.storeCard}
            onPress={() => handleSelectStore(store.id)}
          >
            <Feather name="store" size={24} color="#0ea5e9" />
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{store.name}</Text>
              {store.locationAddress && (
                <Text style={styles.storeLocation}>{store.locationAddress}</Text>
              )}
            </View>
            <Feather name="chevron-right" size={24} color="#71717a" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fafafa',
    marginBottom: 8,
    marginTop: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#a1a1aa',
    marginBottom: 32,
  },
  storeList: {
    flex: 1,
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  storeInfo: {
    flex: 1,
    marginLeft: 16,
  },
  storeName: {
    color: '#fafafa',
    fontSize: 18,
    fontWeight: '600',
  },
  storeLocation: {
    color: '#71717a',
    fontSize: 14,
    marginTop: 4,
  },
});

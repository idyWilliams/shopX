import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import type { Product, Location } from '../../types';

export default function ActivityScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const { data: productsData } = await supabase
        .from('products')
        .select('*');

      setProducts(productsData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const renderItem = ({ item }: { item: Product }) => (
    <View className="mx-4 mb-4 rounded-3xl bg-zinc-900 border border-zinc-800 p-5">
      <Text className="text-base font-bold text-zinc-50">{item.name}</Text>
      <Text className="text-sm text-zinc-400 mt-1">{item.category}</Text>
      <Text className="text-lg font-bold text-zinc-50 mt-3">
        {item.selling_price}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <ActivityIndicator size="large" color="#0EA5E9" />
        <Text className="text-zinc-400 mt-4">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-zinc-950">
      <View className="px-4 pt-4 pb-6">
        <Text className="text-2xl font-bold text-zinc-50">Activity Feed</Text>
      </View>
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={false} onRefresh={fetchData} />}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <View className="h-24 w-24 items-center justify-center rounded-3xl bg-zinc-800 border border-zinc-700 mb-6">
              <Feather name="package" size={48} color="#71717A" />
            </View>
            <Text className="text-xl font-bold text-zinc-50 mb-2">No Products</Text>
            <Text className="text-zinc-400">Start adding products to your inventory!</Text>
          </View>
        }
      />
    </View>
  );
}

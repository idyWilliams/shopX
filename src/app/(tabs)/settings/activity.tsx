import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import type { Product } from '../../../types';

const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Premium Leather Slides', category: 'Footwear', selling_price: 45000, cost_price: 25000, image_url: '', org_id: '', base_currency: 'NGN', created_at: '', stock_quantity: 10 },
  { id: '2', name: 'Nike Air Max', category: 'Sneakers', selling_price: 85000, cost_price: 55000, image_url: '', org_id: '', base_currency: 'NGN', created_at: '', stock_quantity: 5 },
  { id: '3', name: 'Cargo Pants', category: 'Bottoms', selling_price: 32000, cost_price: 18000, image_url: '', org_id: '', base_currency: 'NGN', created_at: '', stock_quantity: 8 },
];

export default function ActivityScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const { data: productsData, error: fetchError } = await supabase
        .from('products')
        .select('*');

      if (fetchError) throw fetchError;
      setProducts(productsData || []);
    } catch (err: any) {
      console.error('Activity fetch error:', err);
      setProducts(MOCK_PRODUCTS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity className="mx-4 mb-4 rounded-3xl bg-zinc-900 border border-zinc-800 p-5 active:opacity-80">
      <View className="flex-row items-center gap-4">
        <View className="h-12 w-12 rounded-2xl bg-zinc-800 items-center justify-center">
          <Feather name="box" size={22} color="#A1A1AA" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-zinc-50">{item.name}</Text>
          <Text className="text-sm text-zinc-400 mt-0.5">{item.category}</Text>
        </View>
        <Text className="text-base font-bold text-zinc-50">₦{item.selling_price?.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <View className="h-16 w-16 rounded-3xl bg-zinc-900 items-center justify-center mb-4">
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
        <Text className="text-zinc-400 text-sm font-medium">Loading activity...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-zinc-950">
      <View className="px-4 pt-2 pb-4">
        <Text className="text-3xl font-bold text-zinc-50">Activity</Text>
        <Text className="text-sm text-zinc-400 mt-1">Today's feed</Text>
      </View>
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={false} onRefresh={fetchData} tintColor="#0EA5E9" />}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <View className="h-24 w-24 items-center justify-center rounded-3xl bg-zinc-800 border border-zinc-700 mb-6">
              <Feather name="inbox" size={48} color="#71717A" />
            </View>
            <Text className="text-xl font-bold text-zinc-50 mb-2">No Activity Yet</Text>
            <Text className="text-zinc-400 text-center max-w-xs">Sales and operations will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

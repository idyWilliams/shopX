import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import type { ActivityFeed, Product, Location, ActivityType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/security';

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  sale: '#10B981',
  restock: '#3B82F6',
  transfer: '#8B5CF6',
  anomaly: '#F59E0B',
};

const ACTIVITY_ICONS: Record<ActivityType, keyof typeof Feather.glyphMap> = {
  sale: 'trending-up',
  restock: 'package',
  transfer: 'repeat',
  anomaly: 'alert-triangle',
};

export default function FeedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, isLoading: permissionsLoading } = usePermissions();
  const [activities, setActivities] = useState<ActivityFeed[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Calculate today's sales
  const todaysSales = useCallback(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    return activities
      .filter(a => {
        const timestamp = new Date(a.timestamp);
        return (
          a.type === 'sale' &&
          timestamp >= todayStart &&
          timestamp <= todayEnd
        );
      })
      .reduce((sum, a) => sum + (a.total_amount || 0), 0);
  }, [activities]);

  // Calculate active stock
  const activeStock = useCallback(() => {
    return products.reduce((sum, product) => sum + (product.stock_quantity || 0), 0);
  }, [products]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [productsRes, locationsRes, activitiesRes] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('locations').select('*'),
        supabase.from('activities').select('*').order('timestamp', { ascending: false }),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (locationsRes.error) throw locationsRes.error;
      if (activitiesRes.error) throw activitiesRes.error;

      setProducts(productsRes.data || []);
      setLocations(locationsRes.data || []);
      setActivities(activitiesRes.data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getProduct = useCallback(
    (productId: string) => products.find((p) => p.id === productId),
    [products]
  );

  const getLocation = useCallback(
    (locationId: string | null) => locationId ? locations.find((l) => l.id === locationId) : null,
    [locations]
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitInput = async () => {
    if (!inputText.trim()) return;

    try {
      if (!profile?.org_id) {
        Alert.alert('Error', 'Organization not found');
        return;
      }

      setIsSubmitting(true);

      const { data, error } = await supabase.functions.invoke('parse-activity', {
        body: {
          text: inputText,
          imageUrl: null,
        },
      });

      if (error) throw error;

      if (!data?.activity) {
        throw new Error('Failed to parse activity');
      }

      const parsed = data.activity;

      const product = products.find((p) =>
        p.name.toLowerCase().includes(parsed.item.toLowerCase())
      ) || products[0];
      const location = locations.find((l) =>
        l.name.toLowerCase().includes(parsed.location.toLowerCase())
      ) || locations[0];

      if (!product || !location) {
        Alert.alert('Error', 'No product or location found');
        return;
      }

      const { error: insertError } = await supabase.from('activities').insert({
        org_id: profile.org_id,
        type: parsed.action,
        product_id: product.id,
        quantity: parsed.qty,
        source_location_id: parsed.action === 'sale' ? location.id : null,
        target_location_id: parsed.action === 'restock' ? location.id : null,
        total_amount: parsed.amount,
        recorded_by: user?.id,
        payment_method: parsed.paymentMethod || (parsed.amount > 0 ? 'cash' : null),
      });

      if (insertError) throw insertError;

      // Refresh activities
      await fetchData();
      setInputText('');
      setShowInput(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to record activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderActivityCard = ({ item }: { item: ActivityFeed }) => {
    const product = getProduct(item.product_id);
    const sourceLocation = getLocation(item.source_location_id);
    const targetLocation = getLocation(item.target_location_id);

    return (
      <TouchableOpacity
        className="mx-4 mb-3 rounded-2xl p-4"
        style={{ backgroundColor: '#1F2937' }}
        activeOpacity={0.7}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-row items-center gap-3">
            <View
              className="h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: ACTIVITY_COLORS[item.type] + '20' }}
            >
              <Feather name={ACTIVITY_ICONS[item.type]} size={24} color={ACTIVITY_COLORS[item.type]} />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-semibold text-white">
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                </Text>
                <View
                  className="rounded-full px-2 py-0.5"
                  style={{ backgroundColor: ACTIVITY_COLORS[item.type] + '20' }}
                >
                  <Text
                    className="text-xs font-medium"
                    style={{ color: ACTIVITY_COLORS[item.type] }}
                  >
                    {item.type.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text className="mt-1 text-gray-300">
                {item.quantity}x {product?.name || 'Unknown Product'}
              </Text>
              <View className="mt-2 flex-row items-center gap-2">
                <Feather name="package" size={14} color="#9CA3AF" />
                <Text className="text-sm text-gray-400">
                  {sourceLocation?.name || 'Unknown'}
                  {item.type === 'transfer' && targetLocation && (
                    <>
                      {' → '}
                      {targetLocation.name}
                    </>
                  )}
                </Text>
              </View>
            </View>
          </View>
          <View className="items-end">
            {item.total_amount > 0 && (
              <Text className="text-base font-bold" style={{ color: ACTIVITY_COLORS[item.type] }}>
                {formatCurrency(item.total_amount)}
              </Text>
            )}
            <Text className="mt-2 text-xs text-gray-500">{formatTime(item.timestamp)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-900">
        <ActivityIndicator size="large" color="#06B6D4" />
        <Text className="text-zinc-400 mt-4 text-sm">Loading activity feed...</Text>
      </View>
    );
  }

  const organizationName = locations[0] ? (
    // We'll get the actual org name from organizations table later
    'My Business'
  ) : 'My Business';

  return (
    <View className="flex-1 bg-gray-900">
      {/* Header */}
      <View className="border-b border-gray-800 bg-gray-900 px-4 py-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-white">Activity Feed</Text>
            <Text className="text-sm text-gray-400">
              {organizationName}
            </Text>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="h-10 w-10 items-center justify-center rounded-full bg-gray-800"
              onPress={() => router.push('/capture')}
            >
              <Feather name="camera" color="#9CA3AF" size={20} />
            </TouchableOpacity>
            <TouchableOpacity
              className="h-10 w-10 items-center justify-center rounded-full bg-gray-800"
              onPress={() => router.push('/handover')}
            >
              <Feather name="log-out" color="#9CA3AF" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats */}
        <View className="mt-4 flex-row gap-3">
          <TouchableOpacity className="flex-1 flex-row items-center gap-2 rounded-xl bg-gray-800 p-3">
            <Feather name="trending-up" color="#10B981" size={20} />
            <View>
              <Text className="text-xs text-gray-400">Today's Sales</Text>
              <Text className="text-lg font-bold text-white">{formatCurrency(todaysSales())}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 flex-row items-center gap-2 rounded-xl bg-gray-800 p-3">
            <Feather name="package" color="#3B82F6" size={20} />
            <View>
              <Text className="text-xs text-gray-400">Active Stock</Text>
              <Text className="text-lg font-bold text-white">{activeStock()}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Activity Feed */}
      <FlatList
        data={activities}
        renderItem={renderActivityCard}
        keyExtractor={(item) => item.id}
        contentContainerClassName="py-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0EA5E9"
            colors={['#0EA5E9']}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center py-20 px-8">
            <View className="h-24 w-24 items-center justify-center rounded-3xl bg-gray-800 border border-gray-700 mb-6">
              <Feather name="activity" size={48} color="#9CA3AF" />
            </View>
            <Text className="text-xl font-bold text-white mb-2 text-center">Your shop is quiet</Text>
            <Text className="text-gray-400 text-center mb-8">Log your first sale or restock to start tracking your business activity!</Text>
            <TouchableOpacity
              className="flex-row items-center justify-center gap-2 rounded-2xl bg-cyan-500 py-4 px-8"
              onPress={() => setShowInput(true)}
            >
              <Feather name="plus" size={20} color="#FFFFFF" />
              <Text className="text-base font-bold text-white">Log First Activity</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Floating Input Button */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full shadow-lg"
        style={{ backgroundColor: '#0EA5E9' }}
        onPress={() => setShowInput(true)}
        activeOpacity={0.8}
      >
        <Feather name="send" color="#FFFFFF" size={24} />
      </TouchableOpacity>

      {/* Input Modal */}
      <Modal visible={showInput} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-gray-800 p-6">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-white">Quick Entry</Text>
              <TouchableOpacity onPress={() => setShowInput(false)}>
                <Feather name="x" color="#9CA3AF" size={24} />
              </TouchableOpacity>
            </View>
            <TextInput
              className="rounded-xl bg-gray-700 p-4 text-white placeholder-gray-400"
              placeholder="e.g., Sold 2 pairs of leather slides at Shop 1 for 40k"
              placeholderTextColor="#6B7280"
              value={inputText}
              onChangeText={setInputText}
              multiline
              numberOfLines={3}
              style={{ textAlignVertical: 'top' }}
            />
            <TouchableOpacity
              className={`mt-4 items-center rounded-xl py-4 ${isSubmitting ? 'opacity-50' : ''}`}
              style={{ backgroundColor: '#0EA5E9' }}
              onPress={handleSubmitInput}
              disabled={isSubmitting}
            >
              <Text className="font-semibold text-white">{isSubmitting ? 'Submitting...' : 'Submit'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

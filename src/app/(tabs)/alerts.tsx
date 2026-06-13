import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabaseMock } from '../../services/supabaseMock';
import type { StaleStockAlert, FootTrafficEvent } from '../../types';

interface ListItem {
  type: 'stale_header' | 'traffic_header' | 'stale' | 'traffic';
  count?: number;
  id?: string;
  product_id?: string;
  location_id?: string;
  quantity?: number;
  days_inactive?: number;
  product_name?: string;
  location_name?: string;
  start_time?: string;
  end_time?: string;
  motion_count?: number;
  sales_count?: number;
}

export default function AlertsScreen() {
  const [staleAlerts] = useState<StaleStockAlert[]>(supabaseMock.getStaleStockAlerts());
  const [trafficEvents] = useState<FootTrafficEvent[]>(supabaseMock.getFootTrafficEvents());

  const renderStaleStockAlert = (item: StaleStockAlert) => (
    <TouchableOpacity
      className="mx-4 mb-3 overflow-hidden rounded-2xl"
      style={{ backgroundColor: '#1F2937' }}
      activeOpacity={0.7}
    >
      <View className="p-4">
        <View className="flex-row items-start gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-amber-500/20">
            <Feather name="alert-triangle" color="#F59E0B" size={24} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-base font-semibold text-white">STALE STOCK</Text>
              <View className="rounded-full bg-amber-500/20 px-2 py-0.5">
                <Text className="text-xs font-medium text-amber-500">HIGH PRIORITY</Text>
              </View>
            </View>
            <Text className="mt-1 text-gray-300">
              {item.quantity} units of {item.product_name}
            </Text>
            <View className="mt-2 flex-row items-center gap-4">
              <View className="flex-row items-center gap-1">
                <Feather name="clock" size={14} color="#6B7280" />
                <Text className="text-sm text-gray-400">{item.days_inactive} days inactive</Text>
              </View>
            </View>
            <View className="mt-2 rounded-lg bg-gray-800 p-2">
              <Text className="text-sm text-gray-300">
                📍 {item.location_name}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View className="flex-row items-center justify-end bg-amber-500/10 px-4 py-3">
        <Text className="text-sm font-medium text-amber-500">Push to e-commerce</Text>
        <Feather name="arrow-right" size={16} color="#F59E0B" />
      </View>
    </TouchableOpacity>
  );

  const renderTrafficAlert = (item: FootTrafficEvent) => {
    const location = supabaseMock.getLocationById(item.location_id);

    return (
      <TouchableOpacity
        className="mx-4 mb-3 overflow-hidden rounded-2xl"
        style={{ backgroundColor: '#1F2937' }}
        activeOpacity={0.7}
      >
        <View className="p-4">
          <View className="flex-row items-start gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-purple-500/20">
              <Feather name="trending-up" color="#8B5CF6" size={24} />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-semibold text-white">TRAFFIC ANOMALY</Text>
                <View className="rounded-full bg-purple-500/20 px-2 py-0.5">
                  <Text className="text-xs font-medium text-purple-500">REVIEW</Text>
                </View>
              </View>
              <Text className="mt-1 text-gray-300">
                High activity detected but zero sales logged
              </Text>
              <View className="mt-2 flex-row items-center gap-4">
                <View className="flex-row items-center gap-1">
                  <Feather name="trending-up" size={14} color="#6B7280" />
                  <Text className="text-sm text-gray-400">{item.motion_count} visitors</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Text className="text-sm text-gray-400">0 sales</Text>
                </View>
              </View>
              <View className="mt-2 rounded-lg bg-gray-800 p-2">
                <Text className="text-sm text-gray-300">
                  📍 {location?.name || 'Unknown Location'}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View className="flex-row items-center justify-end bg-purple-500/10 px-4 py-3">
          <Text className="text-sm font-medium text-purple-500">Audit staff presence</Text>
          <Feather name="arrow-right" size={16} color="#8B5CF6" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = (title: string, count: number, color: string) => (
    <View className="px-4 py-3">
      <View className="flex-row items-center gap-2">
        <Text className="text-sm font-semibold text-gray-400">{title}</Text>
        <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: color + '20' }}>
          <Text className="text-xs font-medium" style={{ color }}>
            {count}
          </Text>
        </View>
      </View>
    </View>
  );

  const listData: ListItem[] = [
    { type: 'stale_header', count: staleAlerts.length },
    ...staleAlerts.map((a) => ({ type: 'stale' as const, ...a })),
    { type: 'traffic_header', count: trafficEvents.length },
    ...trafficEvents.map((t) => ({ type: 'traffic' as const, ...t })),
  ];

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'stale_header') {
      return renderSectionHeader('STALE STOCK', item.count || 0, '#F59E0B');
    }
    if (item.type === 'traffic_header') {
      return renderSectionHeader('TRAFFIC ANOMALIES', item.count || 0, '#8B5CF6');
    }
    if (item.type === 'stale') {
      return renderStaleStockAlert(item as unknown as StaleStockAlert);
    }
    if (item.type === 'traffic') {
      return renderTrafficAlert(item as unknown as FootTrafficEvent);
    }
    return null;
  };

  return (
    <View className="flex-1 bg-gray-900">
      <View className="border-b border-gray-800 bg-gray-900 px-4 py-4">
        <Text className="text-2xl font-bold text-white">Alerts</Text>
        <Text className="mt-1 text-sm text-gray-400">
          {staleAlerts.length + trafficEvents.length} active alerts
        </Text>
      </View>

      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        contentContainerClassName="py-4"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Feather name="alert-circle" color="#374151" size={48} />
            <Text className="mt-4 text-gray-500">No alerts at the moment</Text>
            <Text className="mt-1 text-sm text-gray-600">Everything looks good!</Text>
          </View>
        }
      />
    </View>
  );
}

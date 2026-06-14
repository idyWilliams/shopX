import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { usePermissions, useSubscription } from '../../hooks/security';
import type { LeadSignal, Product, Organization } from '../../types';

// Mock lead signals for demo
const MOCK_LEADS: LeadSignal[] = [
  {
    id: '1',
    product_name: 'Ankara Weekend Dress',
    location: 'Lekki, Lagos',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    match_confidence: 98,
    is_locked: true,
  },
  {
    id: '2',
    product_name: 'Nigerian Lace Fabric - Gold',
    location: 'Victoria Island, Lagos',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    match_confidence: 92,
    is_locked: true,
  },
  {
    id: '3',
    product_name: 'Leather Slides - Tan',
    location: 'Surulere, Lagos',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    match_confidence: 88,
    is_locked: true,
  },
  {
    id: '4',
    product_name: 'Designer Heels - Red',
    location: 'Ikeja, Lagos',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    match_confidence: 85,
    is_locked: true,
  },
  {
    id: '5',
    product_name: 'Leather Tote Bag - Cognac',
    location: 'Ajah, Lagos',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    match_confidence: 79,
    is_locked: true,
  },
];

const AccessGate = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { isLoading, hasProAccess } = useSubscription();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950">
        <ActivityIndicator size="large" color="#06B6D4" />
        <Text className="text-zinc-400 mt-4 text-sm">Checking subscription...</Text>
      </View>
    );
  }

  if (!hasProAccess) {
    return (
      <View className="flex-1 bg-zinc-950 p-4">
        <View className="flex-1 items-center justify-center">
          <View className="h-24 w-24 items-center justify-center rounded-3xl bg-zinc-800 border border-zinc-700 mb-6">
            <Feather name="lock" size={48} color="#A1A1AA" />
          </View>
          <Text className="text-2xl font-bold text-zinc-50 mb-2 text-center">
            Lead Hunter is Premium
          </Text>
          <Text className="text-sm text-zinc-400 mb-8 text-center max-w-xs">
            Unlock AI-powered lead hunting and grow your sales by 40%!
          </Text>
          <TouchableOpacity
            className="w-full max-w-xs flex-row items-center justify-center gap-2 rounded-2xl bg-cyan-500 py-4"
            onPress={() => router.push('/upgrade')}
          >
            <Feather name="zap" size={20} color="#FFFFFF" />
            <Text className="text-base font-bold text-white">Upgrade to Pro</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <>{children}</>;
};

export default function LeadsScreen() {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadSignal[]>(MOCK_LEADS);
  const { hasProAccess, isInTrial } = useSubscription();
  const { profile } = usePermissions();

  const isPremium = hasProAccess;

  // AI lead matching logic
  const filterLeadsByInventory = (
    leadsToFilter: LeadSignal[],
    products: Product[]
  ): LeadSignal[] => {
    return leadsToFilter.filter(lead => {
      const matchesProduct = products.some(product =>
        product.name.toLowerCase().includes(lead.product_name.toLowerCase()) ||
        lead.product_name.toLowerCase().includes(product.name.toLowerCase())
      );
      return matchesProduct;
    });
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 90) return '#10B981';
    if (confidence >= 80) return '#3B82F6';
    return '#F59E0B';
  };

  const renderLeadItem = ({ item }: { item: LeadSignal }) => (
    <View className="mx-4 mb-4 rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden">
      {item.is_locked && !isPremium ? (
        <View className="p-5">
          <View className="flex-row items-center gap-3 mb-3">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 border border-zinc-700">
              <Feather name="lock" size={24} color="#A1A1AA" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-zinc-400">Premium Lead</Text>
              <Text className="text-sm text-zinc-500 mt-1">
                {item.location} • {formatTimeAgo(item.timestamp)}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3">
            <View
              className="px-3 py-1 rounded-full border"
              style={{
                backgroundColor: `${getConfidenceColor(item.match_confidence)}15`,
                borderColor: `${getConfidenceColor(item.match_confidence)}30`,
              }}
            >
              <Text className="text-xs font-bold" style={{ color: getConfidenceColor(item.match_confidence) }}>
                {item.match_confidence}% Match
              </Text>
            </View>
            <Text className="text-sm text-zinc-500">
              High intent customer nearby
            </Text>
          </View>

          <TouchableOpacity
            className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl bg-cyan-500 py-3"
            onPress={() => router.push('/upgrade')}
          >
            <Feather name="zap" size={18} color="#FFFFFF" />
            <Text className="text-sm font-bold text-white">
              Upgrade to Unlock
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="p-5">
          <View className="flex-row items-center gap-3 mb-3">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <Feather name="trending-up" size={24} color="#10B981" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-zinc-50">{item.product_name}</Text>
              <Text className="text-sm text-zinc-400 mt-1">
                {item.location} • {formatTimeAgo(item.timestamp)}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3">
            <View
              className="px-3 py-1 rounded-full border"
              style={{
                backgroundColor: `${getConfidenceColor(item.match_confidence)}15`,
                borderColor: `${getConfidenceColor(item.match_confidence)}30`,
              }}
            >
              <Text className="text-xs font-bold" style={{ color: getConfidenceColor(item.match_confidence) }}>
                {item.match_confidence}% Match
              </Text>
            </View>
          </View>

          <TouchableOpacity
            className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl bg-zinc-800 border border-zinc-700 py-3"
          >
            <Feather name="send" size={18} color="#A1A1AA" />
            <Text className="text-sm font-semibold text-zinc-300">
              Contact Lead via WhatsApp
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <AccessGate>
      <View className="flex-1 bg-zinc-950">
        <View className="border-b border-zinc-800 bg-zinc-950 px-4 py-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-zinc-50">Lead Hunter</Text>
              <Text className="text-sm text-zinc-400 mt-1">
                {leads.length} high-intent signals nearby
              </Text>
            </View>
            {isInTrial && (
              <View className="flex-row items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30">
                <Feather name="clock" size={14} color="#06B6D4" />
                <Text className="text-xs font-semibold text-cyan-400">7-Day Trial</Text>
              </View>
            )}
            {hasProAccess && !isInTrial && (
              <View className="flex-row items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30">
                <Feather name="star" size={14} color="#EAB308" />
                <Text className="text-xs font-semibold text-yellow-400">Pro</Text>
              </View>
            )}
          </View>
        </View>

        <FlatList
          data={leads}
          renderItem={renderLeadItem}
          keyExtractor={item => item.id}
          contentContainerClassName="py-4"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-8">
              <View className="h-24 w-24 items-center justify-center rounded-3xl bg-zinc-800 border border-zinc-700 mb-6">
                <Feather name="search" size={48} color="#71717A" />
              </View>
              <Text className="text-xl font-bold text-zinc-50 mb-2 text-center">No leads found</Text>
              <Text className="text-zinc-400 text-center mb-8">Check back soon for high-intent customers nearby!</Text>
            </View>
          }
        />
      </View>
    </AccessGate>
  );
}

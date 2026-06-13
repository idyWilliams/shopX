import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { usePermissions, useSubscription } from '../hooks/security';

const PricingFeature = ({ icon, text }: { icon: string; text: string }) => (
  <View className="flex-row items-center gap-3 py-2">
    <View className="h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10">
      <Feather name="check" size={14} color="#10B981" />
    </View>
    <Text className="flex-1 text-sm text-zinc-300 leading-5">{text}</Text>
  </View>
);

export default function UpgradeScreen() {
  const router = useRouter();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { profile } = usePermissions();

  const handleUpgrade = async () => {
    setIsPurchasing(true);
    
    // Simulate purchase flow and update is_pro
    try {
      if (profile?.org_id) {
        await supabase
          .from('organizations')
          .update({ is_pro: true })
          .eq('id', profile.org_id);
      }
      
      setTimeout(() => {
        setIsPurchasing(false);
        Alert.alert(
          '🎉 Pro Activated!',
          'Welcome to shopX Pro! Your lead hunting engine is now active.',
          [{ text: 'Awesome!', onPress: () => router.back() }]
        );
      }, 2000);
    } catch (error) {
      console.error('Upgrade error:', error);
      setIsPurchasing(false);
      Alert.alert('Upgrade Failed', 'Please try again.');
    }
  };

  return (
    <ScrollView className="flex-1 bg-zinc-950" contentContainerClassName="pb-32">
      {/* Header */}
      <View className="border-b border-zinc-800 bg-zinc-950 px-4 py-6">
        <TouchableOpacity
          className="absolute left-4 top-4 h-10 w-10 items-center justify-center rounded-full bg-zinc-800"
          onPress={() => router.back()}
        >
          <Feather name="x" size={20} color="#A1A1AA" />
        </TouchableOpacity>
        <Text className="text-center text-3xl font-bold text-zinc-50">
          Upgrade to Premium
        </Text>
        <Text className="text-center text-sm text-zinc-400 mt-2">
          Unlock your growth potential
        </Text>
      </View>

      {/* Hero Pricing Card */}
      <View className="mx-4 mt-6 p-6 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40">
        <View className="flex-row items-start justify-between mb-6">
          <View>
            <Text className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-1">
              Pro
            </Text>
            <Text className="text-5xl font-bold text-white">
              ₦2,500
            </Text>
            <Text className="text-sm text-zinc-400">per month</Text>
          </View>
          <View className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
            <Text className="text-xs font-semibold text-emerald-400">
              +40% Revenue
            </Text>
          </View>
        </View>

        <PricingFeature icon="trending-up" text="AI Lead Hunter Engine - Find nearby customers" />
        <PricingFeature icon="message-circle" text="Unlimited WhatsApp business templates" />
        <PricingFeature icon="database" text="Advanced Analytics & Sales Insights" />
        <PricingFeature icon="users" text="Unlimited team members" />
        <PricingFeature icon="shield" text="Priority customer support" />
        <PricingFeature icon="settings" text="Multi-location inventory sync" />

        <TouchableOpacity
          className={`w-full mt-6 flex-row items-center justify-center gap-2 rounded-2xl py-4 ${isPurchasing ? 'bg-zinc-800' : 'bg-cyan-500'}`}
          onPress={handleUpgrade}
          disabled={isPurchasing}
        >
          {isPurchasing ? (
            <>
              <Feather name="loader" size={20} color="#FFFFFF" />
              <Text className="text-base font-bold text-white">Processing...</Text>
            </>
          ) : (
            <>
              <Feather name="zap" size={20} color="#FFFFFF" />
              <Text className="text-base font-bold text-white">Subscribe</Text>
            </>
          )}
        </TouchableOpacity>

        <Text className="text-center text-xs text-zinc-500 mt-4">
          No credit card required • Cancel anytime
        </Text>
      </View>

      {/* Comparison Section */}
      <View className="mx-4 mt-8">
        <Text className="text-xl font-bold text-zinc-50 mb-6">
          What You're Unlocking
        </Text>

        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
            <Text className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Basic
            </Text>
            <Text className="text-2xl font-bold text-zinc-400">₦0</Text>
          </View>
          <View className="flex-1 p-4 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-emerald-500/15 border border-cyan-500/40">
            <Text className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
              Pro
            </Text>
            <Text className="text-2xl font-bold text-white">₦2,500</Text>
          </View>
        </View>

        <View className="space-y-2">
          <View className="flex-row items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
            <Text className="text-sm text-zinc-400">Lead Hunting</Text>
            <View className="flex-row gap-6">
              <View className="w-6 items-center">
                <Feather name="x" size={16} color="#EF4444" />
              </View>
              <View className="w-6 items-center">
                <Feather name="check" size={16} color="#10B981" />
              </View>
            </View>
          </View>

          <View className="flex-row items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
            <Text className="text-sm text-zinc-400">Locations</Text>
            <View className="flex-row gap-6">
              <Text className="text-xs font-semibold text-zinc-500 w-6 text-center">1</Text>
              <Text className="text-xs font-semibold text-emerald-400 w-6 text-center">∞</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
            <Text className="text-sm text-zinc-400">WhatsApp Templates</Text>
            <View className="flex-row gap-6">
              <Text className="text-xs font-semibold text-zinc-500 w-6 text-center">3</Text>
              <Text className="text-xs font-semibold text-emerald-400 w-6 text-center">∞</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
            <Text className="text-sm text-zinc-400">AI Insights</Text>
            <View className="flex-row gap-6">
              <View className="w-6 items-center">
                <Feather name="x" size={16} color="#EF4444" />
              </View>
              <View className="w-6 items-center">
                <Feather name="check" size={16} color="#10B981" />
              </View>
            </View>
          </View>

          <View className="flex-row items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
            <Text className="text-sm text-zinc-400">Support</Text>
            <View className="flex-row gap-6">
              <Text className="text-xs font-semibold text-zinc-500 w-6 text-center">Email</Text>
              <Text className="text-xs font-semibold text-emerald-400 w-6 text-center">24/7</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

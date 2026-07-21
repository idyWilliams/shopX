import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { usePermissions, useSubscription } from '../../../hooks/security';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const { profile, isLoading: permissionsLoading } = usePermissions();
  const { organization, isLoading: subscriptionLoading } = useSubscription();

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderSettingsItem = (
    iconName: string,
    title: string,
    subtitle?: string,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      className="flex-row items-center gap-4 border-b border-zinc-800 px-4 py-4"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
        <Feather name={iconName as any} color="#A1A1AA" size={20} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-medium text-zinc-50">{title}</Text>
        {subtitle && <Text className="text-sm text-zinc-400">{subtitle}</Text>}
      </View>
      <Feather name="chevron-right" color="#71717A" size={20} />
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 bg-zinc-950" contentContainerStyle={{ paddingBottom: 110 }}>
      <View className="border-b border-zinc-800 bg-zinc-950 px-4 py-4">
        <Text className="text-2xl font-bold text-zinc-50">Settings</Text>
        {user && (
          <Text className="text-sm text-zinc-400 mt-1">
            {user.email}
          </Text>
        )}
      </View>

      {/* Referral Banner */}
      <TouchableOpacity
        className="mx-4 mt-4 p-4 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-cyan-500/20 border border-yellow-500/30 flex-row items-center gap-3"
        onPress={() => router.push('/store/referral')}
      >
        <View className="h-12 w-12 items-center justify-center rounded-3xl bg-yellow-500/20">
          <Feather name="gift" size={24} color="#EAB308" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-zinc-50">Gift a month, get a month</Text>
          <Text className="text-xs text-zinc-400 mt-1">Share your referral code and earn free Pro</Text>
        </View>
        <Feather name="chevron-right" color="#EAB308" size={20} />
      </TouchableOpacity>

      {/* Operations Section */}
      <View className="mt-6">
        <Text className="px-4 pb-2 text-xs font-semibold uppercase text-zinc-500">
          Operations
        </Text>
        <View className="rounded-2xl bg-zinc-900 mx-4 overflow-hidden border border-zinc-800">
          {renderSettingsItem(
            'activity',
            'Activity Feed',
            'Sales and operations log',
            () => router.push('/settings/activity')
          )}
          {renderSettingsItem(
            'clock',
            'Shift History',
            'View past shifts',
            () => router.push('/settings/shifts')
          )}
          {renderSettingsItem(
            'bell',
            'Alerts',
            'Stale stock, traffic alerts',
            () => router.push('/settings/alerts')
          )}
        </View>
      </View>

      {/* Organization Section */}
      <View className="mt-6">
        <Text className="px-4 pb-2 text-xs font-semibold uppercase text-zinc-500">
          Organization
        </Text>
        <View className="rounded-2xl bg-zinc-900 mx-4 overflow-hidden border border-zinc-800">
          {renderSettingsItem(
            'briefcase',
            organization?.name || 'Loading...',
            organization ? `${organization.tier.charAt(0).toUpperCase() + organization.tier.slice(1)} Plan` : ''
          )}
          {renderSettingsItem(
            'users',
            'Team Members',
            'Manage your team',
            () => router.push('/settings/team')
          )}
          {renderSettingsItem(
            'settings',
            'Business Settings',
            'Configure your business',
            () => router.push('/settings/business-settings')
          )}
        </View>
      </View>

      {/* Account Section */}
      <View className="mt-6 mb-8">
        <Text className="px-4 pb-2 text-xs font-semibold uppercase text-zinc-500">
          Account
        </Text>
        <View className="rounded-2xl bg-zinc-900 mx-4 overflow-hidden border border-zinc-800">
          {renderSettingsItem('log-out', 'Sign Out', 'See you soon!', handleSignOut)}
        </View>
      </View>

      <Text className="mb-8 text-center text-xs text-zinc-600">
        shopX v1.0.0 • Built with care for African retailers
      </Text>
    </ScrollView>
  );
}

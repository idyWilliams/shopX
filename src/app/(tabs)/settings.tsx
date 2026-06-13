import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabaseMock } from '../../services/supabaseMock';
import { useAuth } from '../_layout';

export default function SettingsScreen() {
  const organization = supabaseMock.getOrganization();
  const profiles = supabaseMock.getProfiles();
  const { signOut, user } = useAuth();

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
    <ScrollView className="flex-1 bg-zinc-950">
      <View className="border-b border-zinc-800 bg-zinc-950 px-4 py-4">
        <Text className="text-2xl font-bold text-zinc-50">Settings</Text>
        {user && (
          <Text className="text-sm text-zinc-400 mt-1">
            {user.email}
          </Text>
        )}
      </View>

      {/* Organization Section */}
      <View className="mt-4">
        <Text className="px-4 pb-2 text-xs font-semibold uppercase text-zinc-500">
          Organization
        </Text>
        <View className="rounded-2xl bg-zinc-900 mx-4 overflow-hidden border border-zinc-800">
          {renderSettingsItem(
            'building',
            organization.name,
            `${organization.tier.charAt(0).toUpperCase() + organization.tier.slice(1)} Plan`
          )}
          {renderSettingsItem(
            'map-pin',
            'Locations',
            `${supabaseMock.getLocations().length} locations`
          )}
          {renderSettingsItem(
            'user',
            'Team Members',
            `${profiles.length} members`
          )}
        </View>
      </View>

      {/* Team Section */}
      <View className="mt-6">
        <Text className="px-4 pb-2 text-xs font-semibold uppercase text-zinc-500">
          Team
        </Text>
        <View className="rounded-2xl bg-zinc-900 mx-4 overflow-hidden border border-zinc-800">
          {profiles.map((profile) => (
            <View
              key={profile.id}
              className="flex-row items-center gap-4 border-b border-zinc-800 px-4 py-3"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-cyan-500">
                <Text className="text-sm font-semibold text-white">
                  {profile.name.charAt(0)}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-zinc-50">{profile.name}</Text>
                <View className="flex-row items-center gap-2">
                  <View
                    className="rounded-full px-2 py-0.5"
                    style={{
                      backgroundColor:
                        profile.role === 'owner'
                          ? '#06B6D4'
                          : profile.role === 'manager'
                          ? '#10B981'
                          : '#8B5CF6',
                    }}
                  >
                    <Text className="text-xs font-medium text-white">
                      {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Preferences Section */}
      <View className="mt-6">
        <Text className="px-4 pb-2 text-xs font-semibold uppercase text-zinc-500">
          Preferences
        </Text>
        <View className="rounded-2xl bg-zinc-900 mx-4 overflow-hidden border border-zinc-800">
          {renderSettingsItem(
            'bell',
            'Notifications',
            'Stale stock, traffic alerts'
          )}
          {renderSettingsItem(
            'help-circle',
            'Help & Support',
            'FAQs, contact us'
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
        shopX v1.0.0 • Built with ❤️ for African retailers
      </Text>
    </ScrollView>
  );
}

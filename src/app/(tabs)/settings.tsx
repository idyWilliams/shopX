import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabaseMock } from '../../services/supabaseMock';

export default function SettingsScreen() {
  const organization = supabaseMock.getOrganization();
  const profiles = supabaseMock.getProfiles();

  const renderSettingsItem = (
    iconName: string,
    title: string,
    subtitle?: string,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      className="flex-row items-center gap-4 border-b border-gray-800 px-4 py-4"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-800">
        <Feather name={iconName as any} color="#9CA3AF" size={20} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-medium text-white">{title}</Text>
        {subtitle && <Text className="text-sm text-gray-400">{subtitle}</Text>}
      </View>
      <Feather name="chevron-right" color="#6B7280" size={20} />
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 bg-gray-900">
      <View className="border-b border-gray-800 bg-gray-900 px-4 py-4">
        <Text className="text-2xl font-bold text-white">Settings</Text>
      </View>

      {/* Organization Section */}
      <View className="mt-4">
        <Text className="px-4 pb-2 text-xs font-semibold uppercase text-gray-500">
          Organization
        </Text>
        <View className="rounded-2xl bg-gray-800 mx-4 overflow-hidden">
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
        <Text className="px-4 pb-2 text-xs font-semibold uppercase text-gray-500">
          Team
        </Text>
        <View className="rounded-2xl bg-gray-800 mx-4 overflow-hidden">
          {profiles.map((profile) => (
            <View
              key={profile.id}
              className="flex-row items-center gap-4 border-b border-gray-700 px-4 py-3"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-500">
                <Text className="text-sm font-semibold text-white">
                  {profile.name.charAt(0)}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-white">{profile.name}</Text>
                <View className="flex-row items-center gap-2">
                  <View
                    className="rounded-full px-2 py-0.5"
                    style={{
                      backgroundColor:
                        profile.role === 'owner'
                          ? '#0EA5E9'
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
        <Text className="px-4 pb-2 text-xs font-semibold uppercase text-gray-500">
          Preferences
        </Text>
        <View className="rounded-2xl bg-gray-800 mx-4 overflow-hidden">
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

      {/* Danger Zone */}
      <View className="mt-6 mb-8">
        <Text className="px-4 pb-2 text-xs font-semibold uppercase text-gray-500">
          Account
        </Text>
        <View className="rounded-2xl bg-gray-800 mx-4 overflow-hidden">
          {renderSettingsItem('log-out', 'Sign Out', 'See you soon!')}
        </View>
      </View>

      <Text className="mb-8 text-center text-xs text-gray-600">
        shopX v1.0.0 • Built with ❤️ for African retailers
      </Text>
    </ScrollView>
  );
}

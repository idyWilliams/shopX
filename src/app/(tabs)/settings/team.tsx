import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../_layout';
import { usePermissions } from '../../../hooks/security';
import type { Profile } from '../../../types';

export default function TeamScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin, isLoading: permissionsLoading } = usePermissions();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProfiles() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
        setProfiles(data || []);
      } catch (error) {
        console.error('Error fetching profiles:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfiles();
  }, []);

  const handleInviteStaff = () => {
    if (!isAdmin) return;
    Alert.alert(
      'Coming Soon',
      'Staff invitations will be available in a future update!'
    );
  };

  const handleRemoveStaff = (profile: Profile) => {
    if (!isAdmin) return;
    
    Alert.alert(
      'Remove Staff',
      `Are you sure you want to remove ${profile.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', profile.id);
              
              if (error) throw error;
              
              setProfiles(profiles.filter(p => p.id !== profile.id));
              Alert.alert('Success', 'Staff member removed successfully!');
            } catch (error) {
              console.error('Error removing staff:', error);
              Alert.alert('Error', 'Failed to remove staff member. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (permissionsLoading || isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950">
        <Feather name="loader" size={48} color="#A1A1AA" />
        <Text className="text-zinc-400 mt-4 text-sm">Loading team...</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950 p-8">
        <View className="h-24 w-24 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30 mb-6">
          <Feather name="lock" size={48} color="#EF4444" />
        </View>
        <Text className="text-2xl font-bold text-zinc-50 mb-3">Restricted Access</Text>
        <Text className="text-center text-zinc-400 text-base leading-6">
          Only the business owner can manage staff. Please contact the owner if you need help.
        </Text>
        <TouchableOpacity
          className="mt-8 px-6 py-3 rounded-2xl bg-zinc-800 border border-zinc-700"
          onPress={() => router.back()}
        >
          <Text className="text-base font-semibold text-zinc-300">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-zinc-950">
      <View className="border-b border-zinc-800 bg-zinc-950 px-4 py-4 flex-row items-center gap-3">
        <TouchableOpacity
          className="h-10 w-10 items-center justify-center rounded-full bg-zinc-800"
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color="#A1A1AA" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-zinc-50">Team</Text>
      </View>

      {/* Invite Button */}
      <View className="px-4 py-4">
        <TouchableOpacity
          className="w-full flex-row items-center justify-center gap-3 rounded-2xl bg-cyan-500 py-4"
          onPress={handleInviteStaff}
        >
          <Feather name="user-plus" size={22} color="#FFFFFF" />
          <Text className="text-base font-bold text-white">Invite Staff Member</Text>
        </TouchableOpacity>
      </View>

      {/* Team List */}
      <View className="mt-4">
        <Text className="px-4 pb-2 text-xs font-semibold uppercase text-zinc-500">
          Team Members ({profiles.length})
        </Text>
        <View className="mx-4 rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
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
              
              {/* Only owner sees remove button */}
              {profile.role !== 'owner' && (
                <TouchableOpacity
                  className="h-9 w-9 items-center justify-center rounded-full bg-red-500/10"
                  onPress={() => handleRemoveStaff(profile)}
                >
                  <Feather name="trash-2" size={18} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

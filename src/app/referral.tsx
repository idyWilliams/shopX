import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePermissions } from '../hooks/security';
import { supabase } from '../lib/supabase';

const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export default function ReferralScreen() {
  const router = useRouter();
  const { profile, isLoading: permissionsLoading } = usePermissions();
  const [isSharing, setIsSharing] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    if (profile?.referral_code) {
      setReferralCode(profile.referral_code);
    }
  }, [profile]);

  const shareToWhatsApp = async () => {
    setIsSharing(true);
    try {
      const message = `Hey! Join shopX using my referral link and get 30 days FREE Pro! 🎉\n\nUse my code: ${referralCode}\n\nDownload shopX and start managing your business smarter!`;
      
      // In real app, use Linking to open WhatsApp
      Alert.alert(
        'Share via WhatsApp',
        message,
        [
          { text: 'Copy Message', onPress: () => copyToClipboard(message) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share referral link');
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    // In real app, use Clipboard API
    Alert.alert('Copied!', 'Referral message copied to clipboard');
  };

  if (permissionsLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950">
        <ActivityIndicator size="large" color="#06B6D4" />
        <Text className="text-zinc-400 mt-4 text-sm">Loading referral code...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-zinc-950">
      {/* Header */}
      <View className="border-b border-zinc-800 bg-zinc-950 px-4 py-6">
        <TouchableOpacity
          className="absolute left-4 top-6 h-10 w-10 items-center justify-center rounded-full bg-zinc-800"
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color="#A1A1AA" />
        </TouchableOpacity>
        <View className="items-center">
          <View className="h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-yellow-500/20 to-cyan-500/20 border border-yellow-500/30 mb-4">
            <Feather name="gift" size={32} color="#EAB308" />
          </View>
          <Text className="text-2xl font-bold text-zinc-50">Gift a Month, Get a Month</Text>
          <Text className="text-sm text-zinc-400 mt-2 text-center">
            Share your unique referral code and both you and your friend get 30 days of Pro FREE!
          </Text>
        </View>
      </View>

      {/* Referral Code Card */}
      <View className="mx-4 mt-6 p-6 rounded-3xl bg-zinc-900 border border-zinc-800">
        <Text className="text-sm font-semibold text-zinc-400 mb-4">Your Referral Code</Text>
        <View className="flex-row items-center justify-between p-4 rounded-2xl bg-zinc-800 border border-zinc-700 mb-4">
          <Text className="text-3xl font-bold text-cyan-400 tracking-widest">{referralCode || 'LOADING'}</Text>
          <TouchableOpacity
            className="h-10 w-10 items-center justify-center rounded-full bg-cyan-500"
            onPress={() => copyToClipboard(referralCode)}
          >
            <Feather name="copy" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className={`w-full flex-row items-center justify-center gap-2 rounded-2xl py-4 ${isSharing ? 'bg-zinc-800' : 'bg-gradient-to-r from-cyan-500 to-emerald-500'}`}
          onPress={shareToWhatsApp}
          disabled={isSharing}
        >
          {isSharing ? (
            <>
              <ActivityIndicator color="#FFFFFF" />
              <Text className="text-base font-bold text-white">Sharing...</Text>
            </>
          ) : (
            <>
              <Feather name="send" size={20} color="#FFFFFF" />
              <Text className="text-base font-bold text-white">Share to WhatsApp</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* How It Works */}
      <View className="mx-4 mt-6 mb-32">
        <Text className="text-lg font-bold text-zinc-50 mb-4">How It Works</Text>
        
        <View className="space-y-4">
          <View className="flex-row gap-4">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-500/30 shrink-0">
              <Text className="text-cyan-400 font-bold">1</Text>
            </View>
            <View className="flex-1 pt-1">
              <Text className="text-sm font-semibold text-zinc-50">Share Your Code</Text>
              <Text className="text-sm text-zinc-400 mt-1">Send your unique referral code to friends and colleagues</Text>
            </View>
          </View>

          <View className="flex-row gap-4">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30 shrink-0">
              <Text className="text-emerald-400 font-bold">2</Text>
            </View>
            <View className="flex-1 pt-1">
              <Text className="text-sm font-semibold text-zinc-50">They Sign Up</Text>
              <Text className="text-sm text-zinc-400 mt-1">Your friend signs up for shopX and uses your referral code</Text>
            </View>
          </View>

          <View className="flex-row gap-4">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20 border border-yellow-500/30 shrink-0">
              <Text className="text-yellow-400 font-bold">3</Text>
            </View>
            <View className="flex-1 pt-1">
              <Text className="text-sm font-semibold text-zinc-50">Both Get Rewarded</Text>
              <Text className="text-sm text-zinc-400 mt-1">You and your friend both get 30 days of Pro absolutely FREE!</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

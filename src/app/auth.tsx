import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function AuthScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMagicLink = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
      });

      if (error) throw error;

      Alert.alert(
        'Magic Link Sent!',
        'Check your email for the sign-in link.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error sending magic link:', error);
      Alert.alert(
        'Error',
        'Failed to send magic link. Please try again or check your internet connection.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-zinc-950"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-8 py-12">
        {/* Logo and Branding */}
        <View className="mb-12 items-center">
          <View className="h-24 w-24 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 mb-4">
            <Feather name="package" size={48} color="#06B6D4" />
          </View>
          <Text className="text-3xl font-bold text-zinc-50 mb-2">shopX</Text>
          <Text className="text-zinc-400 text-sm">Retail, simplified.</Text>
        </View>

        {/* Email Input */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-zinc-400 mb-3">
            Enter your business email
          </Text>
          <View className="flex-row items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
            <Feather name="mail" size={20} color="#71717A" />
            <TextInput
              className="flex-1 ml-3 text-zinc-50 text-base"
              placeholder="you@business.com"
              placeholderTextColor="#71717A"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          className="flex-row items-center justify-center rounded-2xl py-5 bg-cyan-500 active:opacity-80"
          onPress={handleSendMagicLink}
          disabled={isLoading}
          style={{
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? (
            <>
              <Feather name="loader" size={20} color="#FFFFFF" />
              <Text className="font-bold text-white text-base ml-2">
                Sending Magic Link...
              </Text>
            </>
          ) : (
            <Text className="font-bold text-white text-base">
              Continue
            </Text>
          )}
        </TouchableOpacity>

        {/* Helper Text */}
        <Text className="mt-6 text-center text-zinc-500 text-xs">
          We'll send a magic link to your email—no password needed.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

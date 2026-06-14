import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import CountryPicker, { CountryCode, Country } from 'react-native-country-picker-modal';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthMethod = 'email' | 'phone';

export default function AuthScreen() {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState<CountryCode>('US');
  const [callingCode, setCallingCode] = useState('1');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);

  // Load persisted credentials on mount
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('@shopx_email');
        const savedPhone = await AsyncStorage.getItem('@shopx_phone');
        const savedCountry = await AsyncStorage.getItem('@shopx_country_code');
        const savedCalling = await AsyncStorage.getItem('@shopx_calling_code');
        const savedMethod = await AsyncStorage.getItem('@shopx_auth_method');

        if (savedEmail) setEmail(savedEmail);
        if (savedPhone) setPhone(savedPhone);
        if (savedCountry) setCountryCode(savedCountry as CountryCode);
        if (savedCalling) setCallingCode(savedCalling);
        if (savedMethod) setAuthMethod(savedMethod as AuthMethod);
      } catch (e) {
        console.error('Failed to load credentials', e);
      }
    };
    loadSavedCredentials();
  }, []);

  const handleSendOtp = async () => {
    const identifier = authMethod === 'email' ? email.trim() : `+${callingCode}${phone.trim()}`;
    
    if (authMethod === 'email' && (!email.trim() || !email.includes('@'))) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }
    
    if (authMethod === 'phone' && (!phone.trim() || phone.length < 7)) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }

    try {
      setIsLoading(true);

      // Persist inputs
      await AsyncStorage.setItem('@shopx_auth_method', authMethod);
      if (authMethod === 'email') {
        await AsyncStorage.setItem('@shopx_email', email);
      } else {
        await AsyncStorage.setItem('@shopx_phone', phone);
        await AsyncStorage.setItem('@shopx_country_code', countryCode);
        await AsyncStorage.setItem('@shopx_calling_code', callingCode);
      }

      const { error } = await supabase.auth.signInWithOtp(
        authMethod === 'email' 
          ? { email: identifier } 
          : { phone: identifier }
      );

      if (error) throw error;

      setShowOtpInput(true);
      Alert.alert(
        'Code Sent!',
        `Check your ${authMethod} for the verification code.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      Alert.alert('Error', error.message || 'Failed to send code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit code.');
      return;
    }

    const identifier = authMethod === 'email' ? email.trim() : `+${callingCode}${phone.trim()}`;

    try {
      setIsLoading(true);

      const { error, data: { session } } = await supabase.auth.verifyOtp({
        [authMethod]: identifier,
        token: otp,
        type: authMethod === 'email' ? 'email' : 'sms',
      });

      if (error) throw error;

      if (session) {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      Alert.alert('Error', error.message || 'Invalid or expired code.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSelectCountry = (country: Country) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-zinc-950"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-8 py-12">
        {/* Logo and Branding */}
        <View className="mb-8 items-center">
          <View className="h-20 w-20 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 mb-4">
            <Feather name="package" size={40} color="#06B6D4" />
          </View>
          <Text className="text-3xl font-bold text-zinc-50 mb-1">shopX</Text>
          <Text className="text-zinc-400 text-sm">Retail, simplified.</Text>
        </View>

        {!showOtpInput ? (
          <>
            {/* Method Toggle */}
            <View className="flex-row bg-zinc-900/50 p-1 rounded-xl mb-8 border border-zinc-800">
              <TouchableOpacity 
                onPress={() => setAuthMethod('email')}
                className={`flex-1 py-3 rounded-lg flex-row items-center justify-center ${authMethod === 'email' ? 'bg-zinc-800' : ''}`}
              >
                <Feather name="mail" size={16} color={authMethod === 'email' ? '#06B6D4' : '#71717A'} />
                <Text className={`ml-2 font-medium ${authMethod === 'email' ? 'text-zinc-50' : 'text-zinc-500'}`}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setAuthMethod('phone')}
                className={`flex-1 py-3 rounded-lg flex-row items-center justify-center ${authMethod === 'phone' ? 'bg-zinc-800' : ''}`}
              >
                <Feather name="phone" size={16} color={authMethod === 'phone' ? '#06B6D4' : '#71717A'} />
                <Text className={`ml-2 font-medium ${authMethod === 'phone' ? 'text-zinc-50' : 'text-zinc-500'}`}>Phone</Text>
              </TouchableOpacity>
            </View>

            {authMethod === 'email' ? (
              <View className="mb-6">
                <Text className="text-sm font-medium text-zinc-400 mb-3">Business Email</Text>
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
                  />
                </View>
              </View>
            ) : (
              <View className="mb-6">
                <Text className="text-sm font-medium text-zinc-400 mb-3">Phone Number</Text>
                <View className="flex-row items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
                  <CountryPicker
                    countryCode={countryCode}
                    withFilter
                    withFlag
                    withCallingCode
                    withCallingCodeButton
                    onSelect={onSelectCountry}
                    theme={{
                      backgroundColor: '#18181B',
                      onBackgroundTextColor: '#FAFAFA',
                      fontSize: 16,
                    }}
                  />
                  <View className="w-[1px] h-6 bg-zinc-800 mx-3" />
                  <TextInput
                    className="flex-1 text-zinc-50 text-base"
                    placeholder="000 000 0000"
                    placeholderTextColor="#71717A"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            )}

            <TouchableOpacity
              className="flex-row items-center justify-center rounded-2xl py-5 bg-cyan-500 active:opacity-80"
              onPress={handleSendOtp}
              disabled={isLoading}
              style={{ opacity: isLoading ? 0.6 : 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="font-bold text-white text-base">Send Code</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View className="mb-6">
              <Text className="text-sm font-medium text-zinc-400 mb-3 text-center">
                Enter code sent to {authMethod === 'email' ? email : `+${callingCode}${phone}`}
              </Text>
              <View className="flex-row items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
                <TextInput
                  className="flex-1 text-zinc-50 text-3xl tracking-[20px] font-bold text-center"
                  placeholder="000000"
                  placeholderTextColor="#3F3F46"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
              </View>
            </View>

            <TouchableOpacity
              className="flex-row items-center justify-center rounded-2xl py-5 bg-cyan-500 active:opacity-80"
              onPress={handleVerifyOtp}
              disabled={isLoading}
              style={{ opacity: isLoading ? 0.6 : 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="font-bold text-white text-base">Verify & Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setShowOtpInput(false)}
              className="mt-6 self-center"
            >
              <Text className="text-zinc-500 text-sm">Change {authMethod}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

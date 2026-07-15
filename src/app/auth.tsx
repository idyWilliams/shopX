import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard, TouchableWithoutFeedback } from 'react-native';
import CountryPicker, { CountryCode, Country } from 'react-native-country-picker-modal';
import { supabase } from '../lib/supabase';

type AuthMode = 'whatsapp' | 'email';
type AuthStep = 'input' | 'verify';

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('whatsapp');
  const [step, setStep] = useState<AuthStep>('input');
  
  const [countryCode, setCountryCode] = useState<CountryCode>('NG');
  const [callingCode, setCallingCode] = useState<string>('234');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [resendTimer, setResendTimer] = useState<number>(0);
  
  const otpRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const parseJsonSafe = async (res: Response) => {
    try {
      const text = await res.text();
      return text ? JSON.parse(text) : {};
    } catch {
      return {};
    }
  };

  const handleSendCode = async () => {
    setError('');
    setLoading(true);

    try {
      if (mode === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) throw new Error('Please enter a valid email address.');
        
        const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/send-email-otp`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });
        
        if (!response.ok) {
          const errorMsg = 'Service temporarily unavailable. Please check your admin configuration.';
          const data = await parseJsonSafe(response);
          console.error('[Email OTP Error]', { status: response.status, errorData: data });
          throw new Error(errorMsg);
        }
        console.log(`[OTP] Email OTP sent to: ${email}`);
      } else {
        const cleanedPhone = phone.replace(/\D/g, '');
        if (!cleanedPhone || cleanedPhone.length < 7 || cleanedPhone.length > 15) {
          throw new Error('Please enter a valid phone number (7 to 15 digits).');
        }
        const fullPhone = `+${callingCode}${cleanedPhone}`;
        
        const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/send-whatsapp-otp`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone: fullPhone }),
        });
        
        if (!response.ok) {
          const errorMsg = 'Service temporarily unavailable. Please check your admin configuration.';
          const data = await parseJsonSafe(response);
          console.error('[WhatsApp OTP Error]', { status: response.status, errorData: data });
          throw new Error(errorMsg);
        }
      }

      setStep('verify');
      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (enteredOtp: string) => {
    setError('');
    setLoading(true);

    try {
      if (mode === 'email') {
        const verifyRes = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/verify-email-otp`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, otp: enteredOtp }),
        });
        
        const verifyData = await parseJsonSafe(verifyRes);

        if (!verifyRes.ok) {
          throw new Error(verifyData.error || 'Invalid OTP.');
        }

        const { error: authError } = await supabase.auth.verifyOtp({
          token_hash: verifyData.token_hash,
          type: 'magiclink'
        });
        if (authError) throw authError;
      } else {
        const cleanedPhone = phone.replace(/\D/g, '');
        const fullPhone = `+${callingCode}${cleanedPhone}`;
        const verifyRes = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/verify-whatsapp-otp`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone: fullPhone, otp: enteredOtp }),
        });
        
        const verifyData = await parseJsonSafe(verifyRes);

        if (!verifyRes.ok) {
          throw new Error(verifyData.error || 'Invalid OTP.');
        }

        const { error: authError } = await supabase.auth.verifyOtp({
          token_hash: verifyData.token_hash,
          type: 'magiclink'
        });
        if (authError) throw authError;
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text !== '' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    if (index === 5 && text !== '') {
      handleVerify(newOtp.join(''));
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-zinc-950 px-6 justify-center"
      >
      <View className="items-center mb-10">
        <Text className="text-[#0EA5E9] text-4xl font-extrabold tracking-widest">ShopX</Text>
        <Text className="text-zinc-400 mt-2 text-base">Secure Business Access</Text>
      </View>

      {step === 'input' ? (
        <View className="w-full">
          <View className="flex-row bg-zinc-900 rounded-lg p-1 mb-6">
            <TouchableOpacity
              className={`flex-1 py-3 rounded-md items-center ${mode === 'whatsapp' ? 'bg-zinc-800' : ''}`}
              onPress={() => { setMode('whatsapp'); setError(''); }}
            >
              <Text className={`${mode === 'whatsapp' ? 'text-white font-bold' : 'text-zinc-500'}`}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 rounded-md items-center ${mode === 'email' ? 'bg-zinc-800' : ''}`}
              onPress={() => { setMode('email'); setError(''); }}
            >
              <Text className={`${mode === 'email' ? 'text-white font-bold' : 'text-zinc-500'}`}>Email</Text>
            </TouchableOpacity>
          </View>

          {mode === 'whatsapp' ? (
            <View className="flex-row items-center border border-zinc-800 rounded-lg h-14 bg-zinc-900 px-4 mb-2">
              <CountryPicker
                countryCode={countryCode}
                withFilter
                withFlag
                withCallingCode
                theme={{ backgroundColor: '#18181b', onBackgroundTextColor: '#ffffff' }}
                onSelect={(country: Country) => {
                  setCountryCode(country.cca2);
                  setCallingCode(country.callingCode[0]);
                }}
              />
              <Text className="text-white ml-2 text-lg">+{callingCode}</Text>
              <TextInput
                className="flex-1 text-white ml-3 text-lg"
                placeholder="Phone Number"
                placeholderTextColor="#52525b"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(text) => { setPhone(text); setError(''); }}
              />
            </View>
          ) : (
            <TextInput
              className="border border-zinc-800 rounded-lg h-14 bg-zinc-900 px-4 mb-2 text-white text-lg"
              placeholder="Email Address"
              placeholderTextColor="#52525b"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => { setEmail(text); setError(''); }}
            />
          )}

          {error ? <Text className="text-red-500 text-sm mb-4">{error}</Text> : null}

          <TouchableOpacity
            className="bg-[#0EA5E9] rounded-lg h-14 items-center justify-center mt-4"
            disabled={loading}
            onPress={handleSendCode}
          >
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text className="text-white font-bold text-lg">Send Code</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <View className="w-full items-center">
          <Text className="text-zinc-400 text-center mb-6 text-base">
            We sent a code to {mode === 'whatsapp' ? `+${callingCode}${phone}` : email}
          </Text>

          <View className="flex-row justify-between w-full mb-4">
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(el) => { if (el) otpRefs.current[index] = el; }}
                className="w-12 h-14 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-2xl text-center focus:border-[#0EA5E9]"
                maxLength={1}
                keyboardType="numeric"
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleOtpKeyPress(e, index)}
                autoFocus={index === 0}
              />
            ))}
          </View>

          {error ? <Text className="text-red-500 text-sm mb-4">{error}</Text> : null}

          <View className="flex-row justify-between w-full mt-4 items-center">
            <TouchableOpacity onPress={() => { setStep('input'); setOtp(['','','','','','']); setError(''); }}>
              <Text className="text-zinc-400">Change {mode === 'whatsapp' ? 'Phone' : 'Email'}</Text>
            </TouchableOpacity>

            {resendTimer > 0 ? (
              <Text className="text-zinc-600">Resend in {resendTimer}s</Text>
            ) : (
              <TouchableOpacity onPress={handleSendCode} disabled={loading}>
                <Text className="text-[#0EA5E9] font-bold">Resend Code</Text>
              </TouchableOpacity>
            )}
          </View>
          {loading && <ActivityIndicator className="mt-6" color="#ffffff" />}
        </View>
      )}
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

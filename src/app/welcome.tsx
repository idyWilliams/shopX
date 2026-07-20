import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#050505]">
      {/* Background Graphic Effect */}
      <View className="absolute top-0 w-full h-96 opacity-20">
        <View className="absolute top-[-50] left-[-50] w-72 h-72 rounded-full bg-[#0EA5E9] blur-3xl opacity-30" />
        <View className="absolute top-[50] right-[-50] w-72 h-72 rounded-full bg-emerald-500 blur-3xl opacity-20" />
      </View>

      <View className="flex-1 px-6 justify-end pb-12 pt-24">
        {/* Hero Section */}
        <Animated.View 
          entering={FadeInDown.duration(800).springify()}
          className="mb-12"
        >
          <View className="h-20 w-20 bg-white/5 rounded-3xl items-center justify-center mb-8 border border-white/10">
            <Feather name="shopping-bag" size={36} color="#0EA5E9" />
          </View>
          <Text className="text-white text-5xl font-black tracking-tight mb-4 leading-tight">
            Run your store,{'\n'}
            <Text className="text-[#0EA5E9]">from anywhere.</Text>
          </Text>
          <Text className="text-zinc-400 text-lg leading-relaxed font-medium">
            The all-in-one POS, inventory manager, and sales tracker built for ambitious retailers.
          </Text>
        </Animated.View>

        {/* Feature Highlights */}
        <Animated.View 
          entering={FadeInDown.duration(800).delay(200).springify()}
          className="gap-6 mb-16"
        >
          <View className="flex-row items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
            <View className="h-12 w-12 rounded-xl bg-[#0EA5E9]/10 items-center justify-center">
              <Feather name="wifi-off" size={20} color="#0EA5E9" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-base">Offline First</Text>
              <Text className="text-zinc-400 text-sm mt-0.5">Keep selling when internet drops.</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
            <View className="h-12 w-12 rounded-xl bg-emerald-500/10 items-center justify-center">
              <Feather name="bar-chart-2" size={20} color="#10B981" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-base">Track Everything</Text>
              <Text className="text-zinc-400 text-sm mt-0.5">Monitor inventory & cash flow easily.</Text>
            </View>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View 
          entering={FadeInUp.duration(800).delay(400).springify()}
          className="gap-4"
        >
          <TouchableOpacity 
            className="bg-[#0EA5E9] h-14 rounded-2xl items-center justify-center shadow-lg shadow-sky-500/30"
            onPress={() => router.push({ pathname: '/auth', params: { type: 'signup' } })}
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-lg">Create Account</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="h-14 rounded-2xl items-center justify-center border border-white/10 bg-transparent"
            onPress={() => router.push({ pathname: '/auth', params: { type: 'login' } })}
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold text-base">I already have an account</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

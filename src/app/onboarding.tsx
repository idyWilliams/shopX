import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image, Modal, FlatList, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const Onboarding = () => {
  const { setActiveStoreId, setAuthorizedStores, setSoloOwner, createDefaultStore, setHasCompletedOnboarding } = useAuth();

  const [storeName, setStoreName] = useState('');
  const [storeLogo, setStoreLogo] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [merchantEmail, setMerchantEmail] = useState('');
  const [merchantPhone, setMerchantPhone] = useState('');
  const [isSoloOwner, setIsSoloOwner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const categories = [
    'Retail', 'Electronics', 'Grocery', 'Fashion & Apparel',
    'Health & Beauty', 'Restaurant & Cafe', 'Hardware', 'Services', 'Other'
  ];

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setStoreLogo(result.assets[0].uri);
    }
  };

  const completeStep1 = async () => {
    if (!merchantEmail) {
      Alert.alert('Error', 'Please enter your admin email');
      return;
    }
    if (!storeName) {
      Alert.alert('Error', 'Please enter a Store Name');
      return;
    }

    setIsSubmitting(true);
    try {
      const categoriesString = selectedCategories.join(', ');
      const defaultStore = await createDefaultStore('temp-merchant-id', storeName, categoriesString, storeLogo || undefined);

      setSoloOwner(true);
      setActiveStoreId(defaultStore.id);
      setAuthorizedStores([defaultStore]);
      await setHasCompletedOnboarding(true);
      
      // Show success modal with confetti (confetti temporarily removed for web compatibility)
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to complete setup');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#050505' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1">
          {/* Background FX */}
          <View className="absolute top-0 w-full h-96 opacity-20 pointer-events-none">
            <View className="absolute top-[-50] left-[-50] w-72 h-72 rounded-full bg-[#0EA5E9] blur-3xl opacity-30" />
            <View className="absolute top-[50] right-[-50] w-72 h-72 rounded-full bg-emerald-500 blur-3xl opacity-20" />
          </View>

          <ScrollView className="flex-1 px-6 pt-20 pb-12" showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeInDown.duration(600).springify()} className="mb-10">
              <Text className="text-white text-4xl font-extrabold tracking-tight mb-2">Shop Setup</Text>
              <Text className="text-zinc-400 text-base">Let's craft your digital storefront.</Text>
            </Animated.View>

             <Animated.View entering={FadeInDown.duration(600).delay(200).springify()} className="mb-6 flex-row items-center justify-between bg-white/5 border border-white/10 p-5 rounded-2xl">
              <View>
                <Text className="text-zinc-300 font-semibold text-base mb-1">Store Logo</Text>
                <Text className="text-zinc-500 text-sm">Make it recognizable</Text>
              </View>
              <TouchableOpacity
                onPress={pickImage}
                className="h-16 w-16 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center overflow-hidden"
              >
                {storeLogo ? (
                  <Image source={{ uri: storeLogo }} className="w-full h-full" />
                ) : (
                  <Feather name="camera" size={20} color="#0EA5E9" />
                )}
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(600).delay(100).springify()} className="mb-6">
              <Text className="text-zinc-300 font-semibold mb-2 ml-1 text-sm uppercase tracking-wider">Store Name</Text>
              <TextInput
                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-base shadow-sm"
                value={storeName}
                onChangeText={setStoreName}
                placeholder="e.g. Ade's Provision Shop"
                placeholderTextColor="#71717A"
              />
            </Animated.View>



            <Animated.View entering={FadeInDown.duration(600).delay(300).springify()} className="mb-6">
              <Text className="text-zinc-300 font-semibold mb-2 ml-1 text-sm uppercase tracking-wider">Business Categories</Text>
              <TouchableOpacity
                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex-row justify-between items-center shadow-sm"
                onPress={() => setIsCategoryModalVisible(true)}
              >
                <Text className={`text-base ${selectedCategories.length > 0 ? 'text-white font-medium' : 'text-zinc-500'} flex-1 mr-2`} numberOfLines={1}>
                  {selectedCategories.length > 0 ? selectedCategories.join(', ') : 'Select Categories'}
                </Text>
                <Feather name="chevron-down" size={20} color="#71717A" />
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(600).delay(400).springify()} className="mb-6">
              <Text className="text-zinc-300 font-semibold mb-2 ml-1 text-sm uppercase tracking-wider">Admin Email</Text>
              <TextInput
                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-base shadow-sm"
                value={merchantEmail}
                onChangeText={setMerchantEmail}
                placeholder="Enter email address"
                placeholderTextColor="#71717A"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(600).delay(500).springify()} className="mb-10">
              <Text className="text-zinc-300 font-semibold mb-2 ml-1 text-sm uppercase tracking-wider">Contact Phone (Optional)</Text>
              <TextInput
                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-base shadow-sm"
                value={merchantPhone}
                onChangeText={setMerchantPhone}
                placeholder="Enter phone number"
                placeholderTextColor="#71717A"
                keyboardType="phone-pad"
              />
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(600).delay(600).springify()} className="mb-12">
              <TouchableOpacity
                className={`h-14 rounded-2xl items-center justify-center shadow-lg ${isSubmitting ? 'bg-[#0EA5E9]/50' : 'bg-[#0EA5E9] shadow-sky-500/30'}`}
                onPress={completeStep1}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold text-lg">
                  {isSubmitting ? 'Setting up...' : 'Complete Setup'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>

          {/* Category Picker Modal */}
          <Modal visible={isCategoryModalVisible} animationType="slide" transparent={true}>
            <View className="flex-1 bg-black/60 justify-end">
              <View className="bg-[#121212] rounded-t-3xl border-t border-white/10 px-6 pb-12 max-h-[80%]">
                <View className="flex-row justify-between items-center py-6 border-b border-white/5 mb-2">
                  <Text className="text-white text-xl font-bold">Select Categories</Text>
                  <TouchableOpacity onPress={() => setIsCategoryModalVisible(false)} className="px-4 py-2 bg-[#0EA5E9]/20 rounded-full">
                    <Text className="text-[#0EA5E9] font-bold">Done</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={categories}
                  keyExtractor={(item) => item}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => {
                    const isSelected = selectedCategories.includes(item);
                    return (
                      <TouchableOpacity
                        className="flex-row justify-between items-center py-4 border-b border-white/5"
                        onPress={() => {
                          if (isSelected) {
                            setSelectedCategories(prev => prev.filter(c => c !== item));
                          } else {
                            setSelectedCategories(prev => [...prev, item]);
                          }
                        }}
                      >
                        <Text className={`text-lg ${isSelected ? 'text-[#0EA5E9] font-bold' : 'text-zinc-300'}`}>
                          {item}
                        </Text>
                        <View className={`h-6 w-6 rounded-md border items-center justify-center ${isSelected ? 'bg-[#0EA5E9] border-[#0EA5E9]' : 'border-zinc-500'}`}>
                          {isSelected && <Feather name="check" size={16} color="white" />}
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </View>
          </Modal>

          {/* Success Modal */}
          <Modal visible={showSuccessModal} animationType="fade" transparent={true}>
            <View className="flex-1 bg-black/80 justify-center items-center p-6">
              <View className="bg-[#121212] rounded-3xl border border-white/10 p-8 w-full max-w-sm">
                <View className="w-20 h-20 bg-emerald-500 rounded-full items-center justify-center mb-6 mx-auto">
                  <Feather name="check" size={40} color="white" />
                </View>
                <Text className="text-white text-2xl font-extrabold text-center mb-3">Congratulations!</Text>
                <Text className="text-zinc-400 text-center mb-8">Welcome to ShopX! Let's start selling!</Text>
                <TouchableOpacity
                  className="bg-[#0EA5E9] rounded-2xl h-14 items-center justify-center"
                  onPress={() => {
                    setShowSuccessModal(false);
                    router.replace('/(tabs)');
                  }}
                >
                  <Text className="text-white font-bold text-lg">Let's Go!</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default Onboarding;

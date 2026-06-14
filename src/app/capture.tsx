import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { ParsedActivityInput, Product, Location } from '../types';

type Status = 'IDLE' | 'ANALYZING' | 'CONFIRMING';

export default function CaptureScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>('IDLE');
  const [inputText, setInputText] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedActivityInput | null>(null);
  const [pulseAnim] = useState(new Animated.Value(0));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  // Simple parse function instead of mock
  const parseActivityInput = (text: string): ParsedActivityInput => {
    const lowerText = text.toLowerCase();
    let action: ParsedActivityInput['action'] = 'sale';
    if (lowerText.includes('restock') || lowerText.includes('received')) action = 'restock';
    if (lowerText.includes('transfer')) action = 'transfer';

    // Extract quantity
    const qtyMatch = text.match(/(\d+)/);
    const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

    // Extract amount
    const amountMatch = text.match(/(\d+)k/i) || text.match(/total[:\s]*(\d+)/i);
    let amount = 0;
    if (amountMatch) {
      const numStr = amountMatch[1];
      amount = text.toLowerCase().includes('k') ? parseInt(numStr, 10) * 1000 : parseInt(numStr, 10);
    }

    return {
      action,
      item: products.length > 0 ? products[0].name : 'Item',
      qty,
      location: locations.length > 0 ? locations[0].name : 'Location',
      amount,
    };
  };

  // Fetch products and locations on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [productsRes, locationsRes] = await Promise.all([
          supabase.from('products').select('*'),
          supabase.from('locations').select('*')
        ]);

        if (productsRes.error) throw productsRes.error;
        if (locationsRes.error) throw locationsRes.error;

        setProducts(productsRes.data || []);
        setLocations(locationsRes.data || []);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', error.message || 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
    }
  };

  const handleProcessInput = () => {
    if (!inputText.trim()) return;

    setStatus('ANALYZING');
    startPulseAnimation();

    setTimeout(() => {
      const result = parseActivityInput(inputText);
      setParsedResult(result);
      setStatus('CONFIRMING');
      stopPulseAnimation();
    }, 2000);
  };

  const handleConfirmActivity = async () => {
    if (!parsedResult) return;

    const product = products.find((p) =>
      p.name.toLowerCase().includes(parsedResult.item.toLowerCase())
    );
    const location = locations.find((l) =>
      l.name.toLowerCase().includes(parsedResult.location.toLowerCase())
    );

    if (!product || !location) {
      Alert.alert('Error', 'Could not find matching product or location');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const orgId = locations[0]?.org_id;
      if (!orgId) {
        Alert.alert('Error', 'Organization not found');
        return;
      }

      // Create activity record in Supabase
      const { error } = await supabase
        .from('activities')
        .insert([{
          org_id: orgId,
          type: parsedResult.action,
          product_id: product.id,
          quantity: parsedResult.qty,
          source_location_id: parsedResult.action === 'sale' ? location.id : null,
          target_location_id: parsedResult.action === 'restock' ? location.id : null,
          total_amount: parsedResult.amount,
          timestamp: new Date().toISOString(),
        }]);
      
      if (error) throw error;

      Alert.alert('Success', 'Activity recorded!', [
        {
          text: 'OK',
          onPress: () => {
            setStatus('IDLE');
            setInputText('');
            setCapturedImage(null);
            router.replace('/(tabs)');
          },
        },
      ]);
    } catch (error) {
      console.error('Error saving activity:', error);
      Alert.alert(
        'Error',
        'Failed to save activity. Please check your internet connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'sale':
        return '#10B981';
      case 'restock':
        return '#3B82F6';
      case 'transfer':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const getActionBackground = (action: string) => {
    switch (action) {
      case 'sale':
        return '#10B98120';
      case 'restock':
        return '#3B82F620';
      case 'transfer':
        return '#8B5CF620';
      default:
        return '#6B728020';
    }
  };

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.2],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.8],
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950">
        <ActivityIndicator size="large" color="#06B6D4" />
        <Text className="text-zinc-400 mt-4 text-sm">Loading data...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-zinc-950">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-zinc-800">
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="x" color="#A1A1AA" size={24} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-zinc-50">Snap & Chat</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* IDLE State */}
      {status === 'IDLE' && (
        <View className="flex-1 px-4 pt-4 pb-6">
          {/* Image Capture Area */}
          <TouchableOpacity
            className="h-56 items-center justify-center rounded-3xl border-2 border-dashed border-zinc-800 bg-zinc-900 overflow-hidden"
            activeOpacity={0.7}
            onPress={pickImage}
          >
            {capturedImage ? (
              <Image
                source={{ uri: capturedImage }}
                className="h-full w-full"
                resizeMode="cover"
              />
            ) : (
              <View className="items-center">
                <Feather name="camera" color="#71717A" size={56} />
                <Text className="mt-3 text-zinc-500 text-base font-medium">
                  Capture/Select Item Photo
                </Text>
                <Text className="mt-1 text-zinc-600 text-sm">
                  Tap to capture or select from gallery
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Capture/Gallery Buttons */}
          <View className="mt-4 flex-row gap-3">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-4 border border-zinc-800"
              activeOpacity={0.7}
              onPress={takePhoto}
            >
              <Feather name="camera" color="#A1A1AA" size={20} />
              <Text className="text-zinc-300 font-medium">Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-4 border border-zinc-800"
              activeOpacity={0.7}
              onPress={pickImage}
            >
              <Feather name="image" color="#A1A1AA" size={20} />
              <Text className="text-zinc-300 font-medium">Gallery</Text>
            </TouchableOpacity>
          </View>

          {/* Text Input Area */}
          <View className="mt-6 flex-1">
            <Text className="mb-2 text-sm font-medium text-zinc-400">
              Describe the activity (or use voice note)
            </Text>
            <TextInput
              className="flex-1 rounded-2xl bg-zinc-900 p-5 text-zinc-50 placeholder-zinc-600 text-base border border-zinc-800"
              placeholder="e.g., Just sold 3 pieces of premium lace at Shop 2 for 90k"
              placeholderTextColor="#71717A"
              value={inputText}
              onChangeText={setInputText}
              multiline
              numberOfLines={6}
              style={{ textAlignVertical: 'top' }}
            />
          </View>

          {/* Process Button */}
          <TouchableOpacity
            className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl py-5 bg-cyan-500"
            onPress={handleProcessInput}
            disabled={!inputText.trim()}
            activeOpacity={0.8}
            style={{
              opacity: inputText.trim() ? 1 : 0.4,
            }}
          >
            <Feather name="zap" color="#FFFFFF" size={22} />
            <Text className="font-bold text-white text-base">
              Process with AI
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ANALYZING State */}
      {status === 'ANALYZING' && (
        <View className="flex-1 items-center justify-center bg-zinc-950 px-6">
          {/* Radar Pulsing Effect */}
          <View className="absolute inset-0 items-center justify-center">
            <Animated.View
              className="absolute h-64 w-64 rounded-full border-4 border-cyan-500"
              style={{
                transform: [{ scale: pulseScale }],
                opacity: pulseOpacity,
              }}
            />
            <Animated.View
              className="absolute h-48 w-48 rounded-full border-2 border-cyan-400"
              style={{
                transform: [{ scale: pulseScale }],
                opacity: pulseOpacity,
              }}
            />
          </View>

          <View className="items-center">
            <View className="h-24 w-24 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-500">
              <Feather name="cpu" color="#06B6D4" size={48} />
            </View>
            <Text className="mt-6 text-zinc-50 text-xl font-bold">
              Processing Vector & Extraction...
            </Text>
            <Text className="mt-2 text-zinc-500 text-base">
              Analyzing image and text input with shopX AI
            </Text>
          </View>
        </View>
      )}

      {/* CONFIRMING State */}
      {status === 'CONFIRMING' && parsedResult && (
        <View className="flex-1 bg-zinc-950 px-4 pt-4">
          {/* Preview Card */}
          <View className="rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden mb-4">
            {/* Image Section */}
            <View className="h-48 bg-zinc-950 items-center justify-center">
              {capturedImage ? (
                <Image
                  source={{ uri: capturedImage }}
                  className="h-full w-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="items-center">
                  <Feather name="image" color="#71717A" size={64} />
                </View>
              )}
            </View>

            {/* AI Interpretation */}
            <View className="p-5">
              <View className="mb-4 flex-row items-center gap-2">
                <Feather name="zap" color="#06B6D4" size={20} />
                <Text className="font-semibold text-zinc-50 text-lg">
                  AI Interpretation Sheet
                </Text>
              </View>

              {/* Action Type */}
              <View className="mb-4">
                <Text className="text-sm text-zinc-500 mb-2">Action Type</Text>
                <View
                  className="px-3 py-2 rounded-xl self-start"
                  style={{
                    backgroundColor: getActionBackground(parsedResult.action),
                    borderWidth: 1,
                    borderColor: getActionColor(parsedResult.action) + '40',
                  }}
                >
                  <Text
                    className="font-bold capitalize"
                    style={{ color: getActionColor(parsedResult.action) }}
                  >
                    {parsedResult.action}
                  </Text>
                </View>
              </View>

              {/* Extracted Details */}
              <View className="gap-4">
                {/* Product Name */}
                <View className="flex-row justify-between items-center p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <View className="flex-row items-center gap-2">
                    <Feather name="tag" color="#71717A" size={16} />
                    <Text className="text-sm text-zinc-500">Product Name</Text>
                  </View>
                  <Text className="text-sm font-semibold text-zinc-50">
                    {parsedResult.item}
                  </Text>
                </View>

                {/* Location */}
                <View className="flex-row justify-between items-center p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <View className="flex-row items-center gap-2">
                    <Feather name="map-pin" color="#71717A" size={16} />
                    <Text className="text-sm text-zinc-500">Location</Text>
                  </View>
                  <Text className="text-sm font-semibold text-zinc-50">
                    {parsedResult.location}
                  </Text>
                </View>

                {/* Quantity */}
                <View className="flex-row justify-between items-center p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <View className="flex-row items-center gap-2">
                    <Feather name="package" color="#71717A" size={16} />
                    <Text className="text-sm text-zinc-500">Quantity</Text>
                  </View>
                  <Text className="text-sm font-semibold text-zinc-50">
                    {parsedResult.qty}
                  </Text>
                </View>

                {/* Total Value */}
                {parsedResult.amount > 0 && (
                  <View className="flex-row justify-between items-center p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                    <View className="flex-row items-center gap-2">
                      <Feather name="dollar-sign" color="#71717A" size={16} />
                      <Text className="text-sm text-zinc-500">Total Value</Text>
                    </View>
                    <Text className="text-sm font-bold text-zinc-50">
                      ₦{parsedResult.amount.toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mt-auto pb-6">
            <TouchableOpacity
              className="flex-1 items-center justify-center rounded-2xl border border-zinc-800 py-5 bg-zinc-900"
              onPress={() => setStatus('IDLE')}
              activeOpacity={0.7}
            >
              <Text className="font-semibold text-zinc-300">Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 items-center justify-center rounded-2xl py-5 bg-emerald-500"
              onPress={handleConfirmActivity}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center gap-2">
                {isSubmitting ? (
                  <>
                    <Feather name="loader" size={18} color="#FFFFFF" />
                    <Text className="font-bold text-white">
                      Saving...
                    </Text>
                  </>
                ) : (
                  <>
                    <Feather name="check" color="#FFFFFF" size={18} />
                    <Text className="font-bold text-white">
                      Confirm & Post to Feed
                    </Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

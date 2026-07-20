import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { database } from '../../db';
import { Product } from '../../db/models/Product';
import { useAuth } from '../../context/AuthContext';
import * as Haptics from 'expo-haptics';

interface ExchangeRates {
  NGN_TO_USD: number;
  NGN_TO_GBP: number;
}

const useExchangeRates = (): ExchangeRates => {
  return {
    NGN_TO_USD: 0.00067,
    NGN_TO_GBP: 0.00052,
  };
};

const formatCurrency = (amount: number, currency: string): string => {
  const symbols: Record<string, string> = { NGN: '₦', USD: '$', GBP: '£' };
  const symbol = symbols[currency] || '₦';
  if (isNaN(amount)) return `${symbol}0.00`;
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: currency !== 'NGN' ? 2 : 0, maximumFractionDigits: currency !== 'NGN' ? 2 : 0 })}`;
};

const calculateFX = (amount: number, from: string, to: string, rates: ExchangeRates): number => {
  if (from === to) return amount;
  if (from === 'NGN' && to === 'USD') return amount * rates.NGN_TO_USD;
  if (from === 'NGN' && to === 'GBP') return amount * rates.NGN_TO_GBP;
  return amount;
};

export default function InventoryScreen() {
  const { activeStoreId } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const rates = useExchangeRates();

  // Modal State
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const allProducts = await database.get<Product>('products').query().fetch();
      setProducts(allProducts);
    } catch (error: any) {
      console.error('Error fetching inventory data:', error);
      Alert.alert('Error', 'Failed to load local inventory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [activeStoreId]);

  const { totalAssetValue, projectedRevenue, averageMargin } = useMemo(() => {
    let totalAsset = 0;
    let totalRevenue = 0;
    products.forEach((p) => {
      totalAsset += (p.costPrice || 0) * p.stockQuantity;
      totalRevenue += p.sellingPrice * p.stockQuantity;
    });
    let margin = 0;
    if (totalRevenue > 0) {
      margin = Math.round(((totalRevenue - totalAsset) / totalRevenue) * 100);
    }
    return { totalAssetValue: totalAsset, projectedRevenue: totalRevenue, averageMargin: margin };
  }, [products]);

  const handleSaveProduct = async () => {
    if (!name || !price || !stock) {
      Alert.alert('Missing Fields', 'Please fill out all fields');
      return;
    }
    
    try {
      await database.write(async () => {
        if (editingProduct) {
          const product = await database.get<Product>('products').find(editingProduct.id);
          await product.update(p => {
            p.name = name;
            p.sellingPrice = parseFloat(price);
            p.stockQuantity = parseInt(stock, 10);
            if (imageUri) p.imageUrl = imageUri;
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Price Updated', 'All attendants have been notified of the new price.');
        } else {
          await database.get<Product>('products').create(p => {
            p.orgId = activeStoreId || 'default';
            p.name = name;
            p.baseCurrency = 'NGN';
            p.costPrice = parseFloat(price) * 0.7; // Dummy cost
            p.sellingPrice = parseFloat(price);
            p.stockQuantity = parseInt(stock, 10);
            if (imageUri) p.imageUrl = imageUri;
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Product Created', 'New product is now live for all attendants.');
        }
      });
      
      setModalVisible(false);
      resetForm();
      loadProducts();
    } catch (err) {
      console.error('Save failed', err);
      Alert.alert('Error', 'Failed to save product');
    }
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.sellingPrice.toString());
    setStock(product.stockQuantity.toString());
    setImageUri(product.imageUrl || null);
    setModalVisible(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setStock('');
    setImageUri(null);
  };

  const getStockBadgeStyle = (qty: number) => {
    if (qty <= 0) return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' };
    if (qty < 10) return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' };
    return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' };
  };

  const renderItem = ({ item }: { item: Product }) => {
    const badgeStyle = getStockBadgeStyle(item.stockQuantity);
    const baseCurrency = item.baseCurrency || 'NGN';
    const sellingPriceUSD = calculateFX(item.sellingPrice, baseCurrency, 'USD', rates);

    return (
      <TouchableOpacity
        className="mx-4 mb-4 rounded-3xl bg-zinc-900 border border-zinc-800 p-5 active:opacity-90"
        onPress={() => openEditModal(item)}
      >
        <View className="flex-row gap-4">
          <View className="h-20 w-20 items-center justify-center rounded-2xl bg-zinc-800 overflow-hidden">
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <Feather name="box" size={32} color="#71717A" />
            )}
          </View>
          <View className="flex-1">
            <View className="flex-row items-start justify-between">
              <View>
                <Text className="text-base font-bold text-zinc-50">{item.name}</Text>
              </View>
              <View className={`px-3 py-1 rounded-xl border ${badgeStyle.bg} ${badgeStyle.border}`}>
                <Text className={`text-xs font-bold ${badgeStyle.text}`}>
                  {item.stockQuantity <= 0 ? 'SOLD OUT' : `${item.stockQuantity} in stock`}
                </Text>
              </View>
            </View>
            <View className="mt-2">
              <Text className="text-xl font-bold text-zinc-50">
                {formatCurrency(item.sellingPrice, baseCurrency)}
              </Text>
              <Text className="text-xs text-zinc-400 mt-1">
                ≈ {formatCurrency(sellingPriceUSD, 'USD')}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <ActivityIndicator size="large" color="#0EA5E9" />
        <Text className="text-zinc-400 mt-4 text-base">Loading Inventory...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }} edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-4 pb-6 flex-row justify-between items-center">
        <Text className="text-2xl font-bold text-zinc-50">Inventory</Text>
        <TouchableOpacity 
          className="bg-[#0ea5e9] p-3 rounded-full"
          onPress={openAddModal}
        >
          <Feather name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* FX Ledger Widget */}
      <View className="px-4 mb-6">
        <View className="rounded-3xl bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20 p-6">
          <View className="flex-row items-center gap-2 mb-4">
            <Feather name="trending-up" size={20} color="#06B6D4" />
            <Text className="text-sm font-semibold text-cyan-400">Business Health</Text>
          </View>
          <Text className="text-xs text-zinc-400 mb-1">Total Asset Value</Text>
          <Text className="text-3xl font-bold text-zinc-50">{formatCurrency(totalAssetValue, 'NGN')}</Text>
        </View>
      </View>

      {/* Product List */}
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center py-20 px-8">
            <View className="h-24 w-24 items-center justify-center rounded-3xl bg-zinc-800 border border-zinc-700 mb-6">
              <Feather name="package" size={48} color="#71717A" />
            </View>
            <Text className="text-xl font-bold text-zinc-50 mb-2 text-center">No products yet</Text>
            <Text className="text-zinc-400 text-center mb-8">Tap the + button to add products.</Text>
          </View>
        }
      />

      {/* Add/Edit Product Modal */}
      <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-zinc-950">
          <View className="flex-row justify-between items-center p-6 border-b border-zinc-800">
            <Text className="text-2xl font-bold text-white">{editingProduct ? 'Edit Product' : 'New Product'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Feather name="x" size={28} color="#a1a1aa" />
            </TouchableOpacity>
          </View>
          <ScrollView className="p-6">
            <View className="items-center mb-6">
              <TouchableOpacity 
                onPress={pickImage}
                className="h-32 w-32 bg-zinc-900 border border-zinc-800 rounded-3xl items-center justify-center overflow-hidden"
              >
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <View className="items-center">
                    <Feather name="camera" size={32} color="#71717A" />
                    <Text className="text-zinc-500 text-xs mt-2 font-medium">Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <Text className="text-zinc-400 mb-2 text-base">Product Name</Text>
            <TextInput
              className="bg-zinc-900 border border-zinc-800 text-white rounded-xl p-4 mb-6 text-lg"
              placeholder="e.g. Coca-Cola 50cl"
              placeholderTextColor="#52525b"
              value={name}
              onChangeText={setName}
            />
            
            <Text className="text-zinc-400 mb-2 text-base">Selling Price (NGN)</Text>
            <TextInput
              className="bg-zinc-900 border border-zinc-800 text-white rounded-xl p-4 mb-6 text-lg"
              placeholder="0.00"
              placeholderTextColor="#52525b"
              keyboardType="decimal-pad"
              value={price}
              onChangeText={setPrice}
            />

            <Text className="text-zinc-400 mb-2 text-base">Stock Quantity</Text>
            <TextInput
              className="bg-zinc-900 border border-zinc-800 text-white rounded-xl p-4 mb-10 text-lg"
              placeholder="e.g. 50"
              placeholderTextColor="#52525b"
              keyboardType="number-pad"
              value={stock}
              onChangeText={setStock}
            />

            <TouchableOpacity 
              className="bg-[#0ea5e9] py-4 rounded-xl items-center"
              onPress={handleSaveProduct}
            >
              <Text className="text-white font-bold text-lg">Save Product</Text>
            </TouchableOpacity>
            <Text className="text-zinc-500 text-center mt-4 px-4 text-sm">
              Any changes saved here will immediately push to the cloud and notify all attendants.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

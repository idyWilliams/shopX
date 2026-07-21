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

  // Display Preferences
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');

  // Modal State
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
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

  const { totalAssetValue, availableCategories } = useMemo(() => {
    let totalAsset = 0;
    const catSet = new Set<string>();
    products.forEach((p) => {
      totalAsset += (p.costPrice || 0) * p.stockQuantity;
      catSet.add(p.category || 'Uncategorized');
    });
    return { 
      totalAssetValue: totalAsset, 
      availableCategories: ['All', ...Array.from(catSet).sort()]
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategoryFilter === 'All') return products;
    return products.filter(p => (p.category || 'Uncategorized') === selectedCategoryFilter);
  }, [products, selectedCategoryFilter]);

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
            p.category = category || 'Uncategorized';
            if (imageUri) p.imageUrl = imageUri;
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Product Updated', 'Changes pushed to the cloud.');
        } else {
          await database.get<Product>('products').create(p => {
            p.orgId = activeStoreId || 'default';
            p.name = name;
            p.baseCurrency = 'NGN';
            p.costPrice = parseFloat(price) * 0.7; // Dummy cost
            p.sellingPrice = parseFloat(price);
            p.stockQuantity = parseInt(stock, 10);
            p.category = category || 'Uncategorized';
            if (imageUri) p.imageUrl = imageUri;
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Product Created', 'New product is now live.');
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
    setCategory(product.category || '');
    setImageUri(product.imageUrl || null);
    setModalVisible(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setStock('');
    setCategory('');
    setImageUri(null);
  };

  const getStockBadgeStyle = (qty: number) => {
    if (qty <= 0) return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' };
    if (qty < 10) return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' };
    return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' };
  };

  const renderItemList = ({ item }: { item: Product }) => {
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
              <View className="flex-1 mr-2">
                <Text className="text-base font-bold text-zinc-50" numberOfLines={2}>{item.name}</Text>
                <Text className="text-xs font-semibold text-zinc-500 mt-1 uppercase tracking-wider">{item.category || 'Uncategorized'}</Text>
              </View>
              <View className={`px-2 py-1 rounded-xl border ${badgeStyle.bg} ${badgeStyle.border}`}>
                <Text className={`text-xs font-bold ${badgeStyle.text}`}>
                  {item.stockQuantity <= 0 ? 'SOLD OUT' : `${item.stockQuantity} in stock`}
                </Text>
              </View>
            </View>
            <View className="mt-2 flex-row justify-between items-end">
              <View>
                <Text className="text-lg font-bold text-zinc-50">
                  {formatCurrency(item.sellingPrice, baseCurrency)}
                </Text>
                <Text className="text-xs text-zinc-400 mt-0.5">
                  ≈ {formatCurrency(sellingPriceUSD, 'USD')}
                </Text>
              </View>
              <Feather name="edit-2" size={16} color="#71717a" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderItemGrid = ({ item }: { item: Product }) => {
    const badgeStyle = getStockBadgeStyle(item.stockQuantity);
    const baseCurrency = item.baseCurrency || 'NGN';

    return (
      <TouchableOpacity
        className="mb-4 rounded-3xl bg-zinc-900 border border-zinc-800 p-4 active:opacity-90 flex-1 mx-2"
        onPress={() => openEditModal(item)}
      >
        <View className="h-24 w-full items-center justify-center rounded-2xl bg-zinc-800 overflow-hidden mb-3">
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <Feather name="box" size={32} color="#71717A" />
          )}
        </View>
        <View className={`px-2 py-1 rounded-lg border self-start mb-2 ${badgeStyle.bg} ${badgeStyle.border}`}>
          <Text className={`text-[10px] font-bold ${badgeStyle.text}`}>
            {item.stockQuantity <= 0 ? 'SOLD OUT' : `${item.stockQuantity} qty`}
          </Text>
        </View>
        <Text className="text-sm font-bold text-zinc-50 mb-1" numberOfLines={2}>{item.name}</Text>
        <Text className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider" numberOfLines={1}>{item.category || 'Uncategorized'}</Text>
        <View className="flex-row justify-between items-center mt-auto">
          <Text className="text-base font-bold text-[#0ea5e9]">
            {formatCurrency(item.sellingPrice, baseCurrency)}
          </Text>
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
      <View className="px-6 pt-4 pb-4 border-b border-white/5 flex-row justify-between items-center">
        <Text className="text-3xl font-extrabold text-white tracking-tight">Inventory</Text>
        <View className="flex-row gap-3">
          <TouchableOpacity 
            className="bg-white/10 p-3 rounded-full h-12 w-12 items-center justify-center"
            onPress={() => setViewMode(prev => prev === 'list' ? 'grid' : 'list')}
          >
            <Feather name={viewMode === 'list' ? 'grid' : 'list'} size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            className="bg-[#0ea5e9] p-3 rounded-full h-12 w-12 items-center justify-center shadow-lg shadow-sky-500/30"
            onPress={openAddModal}
          >
            <Feather name="plus" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Filter */}
      <View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          className="py-4"
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {availableCategories.map(cat => (
            <TouchableOpacity 
              key={cat}
              onPress={() => setSelectedCategoryFilter(cat)}
              className={`px-4 py-2 rounded-full border ${selectedCategoryFilter === cat ? 'bg-[#0ea5e9] border-[#0ea5e9]' : 'bg-white/5 border-white/10'}`}
            >
              <Text className={`font-semibold ${selectedCategoryFilter === cat ? 'text-white' : 'text-zinc-400'}`}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product List/Grid */}
      <FlatList
        key={viewMode}
        data={filteredProducts}
        renderItem={viewMode === 'list' ? renderItemList : renderItemGrid}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        contentContainerStyle={{ paddingBottom: 110, paddingHorizontal: viewMode === 'grid' ? 8 : 0 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center py-20 px-8">
            <View className="h-24 w-24 items-center justify-center rounded-3xl bg-zinc-800 border border-zinc-700 mb-6">
              <Feather name="package" size={48} color="#71717A" />
            </View>
            <Text className="text-xl font-bold text-zinc-50 mb-2 text-center">No products found</Text>
            <Text className="text-zinc-400 text-center mb-8">Tap the + button to add products to this category.</Text>
          </View>
        }
      />

      {/* Add/Edit Product Modal */}
      <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-zinc-950">
          <View className="flex-row justify-between items-center p-6 border-b border-zinc-800">
            <Text className="text-2xl font-bold text-white">{editingProduct ? 'Edit Product' : 'New Product'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} className="bg-white/10 p-2 rounded-full">
              <Feather name="x" size={24} color="#a1a1aa" />
            </TouchableOpacity>
          </View>
          <ScrollView className="p-6">
            <View className="items-center mb-8">
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

            <Text className="text-zinc-400 mb-2 text-sm uppercase tracking-wider font-semibold ml-1">Product Name</Text>
            <TextInput
              className="bg-zinc-900 border border-zinc-800 text-white rounded-2xl p-4 mb-6 text-lg"
              placeholder="e.g. Coca-Cola 50cl"
              placeholderTextColor="#52525b"
              value={name}
              onChangeText={setName}
            />
            
            <View className="flex-row gap-4 mb-6">
              <View className="flex-1">
                <Text className="text-zinc-400 mb-2 text-sm uppercase tracking-wider font-semibold ml-1">Selling Price (₦)</Text>
                <TextInput
                  className="bg-zinc-900 border border-zinc-800 text-white rounded-2xl p-4 text-lg"
                  placeholder="0.00"
                  placeholderTextColor="#52525b"
                  keyboardType="decimal-pad"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
              <View className="flex-1">
                <Text className="text-zinc-400 mb-2 text-sm uppercase tracking-wider font-semibold ml-1">Stock Quantity</Text>
                <TextInput
                  className="bg-zinc-900 border border-zinc-800 text-white rounded-2xl p-4 text-lg"
                  placeholder="e.g. 50"
                  placeholderTextColor="#52525b"
                  keyboardType="number-pad"
                  value={stock}
                  onChangeText={setStock}
                />
              </View>
            </View>

            <Text className="text-zinc-400 mb-2 text-sm uppercase tracking-wider font-semibold ml-1">Category</Text>
            <TextInput
              className="bg-zinc-900 border border-zinc-800 text-white rounded-2xl p-4 mb-10 text-lg"
              placeholder="e.g. Drinks, Snacks, Electronics"
              placeholderTextColor="#52525b"
              value={category}
              onChangeText={setCategory}
            />

            <TouchableOpacity 
              className="bg-[#0ea5e9] py-4 rounded-2xl items-center shadow-lg shadow-sky-500/30"
              onPress={handleSaveProduct}
            >
              <Text className="text-white font-bold text-lg">Save Product</Text>
            </TouchableOpacity>
            <Text className="text-zinc-500 text-center mt-4 px-4 text-sm">
              Any changes saved here will immediately push to the cloud and notify all attendants.
            </Text>
            <View className="h-20" />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

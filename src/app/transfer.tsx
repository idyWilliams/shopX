import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabaseMock } from '../services/supabaseMock';
import type { Product, Location, Inventory } from '../types';

export default function TransferScreen() {
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId?: string }>();

  const [products] = useState<Product[]>(supabaseMock.getProducts());
  const [locations] = useState<Location[]>(supabaseMock.getLocations());
  const [inventory] = useState<Inventory[]>(supabaseMock.getInventory());

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sourceLocation, setSourceLocation] = useState<Location | null>(null);
  const [targetLocation, setTargetLocation] = useState<Location | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (productId) {
      const product = products.find((p) => p.id === productId);
      if (product) {
        setSelectedProduct(product);
        setStep(2);
      }
    }
  }, [productId, products]);

  const getLocationStock = (productId: string, locationId: string) => {
    const inv = inventory.find(
      (i) => i.product_id === productId && i.location_id === locationId
    );
    return inv?.quantity || 0;
  };

  const handleTransfer = () => {
    if (!selectedProduct || !sourceLocation || !targetLocation) return;

    if (sourceLocation.id === targetLocation.id) {
      Alert.alert('Error', 'Source and target locations must be different');
      return;
    }

    const availableStock = getLocationStock(selectedProduct.id, sourceLocation.id);
    if (quantity > availableStock) {
      Alert.alert('Error', `Only ${availableStock} units available at ${sourceLocation.name}`);
      return;
    }

    const result = supabaseMock.transferStock(
      selectedProduct.id,
      sourceLocation.id,
      targetLocation.id,
      quantity
    );

    if (result.success) {
      Alert.alert('Success', `Transferred ${quantity} units of ${selectedProduct.name}`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const renderStepIndicator = () => (
    <View className="flex-row items-center justify-center gap-2 py-4">
      {[1, 2, 3].map((s) => (
        <View
          key={s}
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: step >= s ? '#0EA5E9' : '#374151' }}
        />
      ))}
    </View>
  );

  const renderProductSelection = () => (
    <View className="px-4">
      <Text className="text-lg font-semibold text-white">Select Product</Text>
      <Text className="mt-1 text-sm text-gray-400">Choose item to transfer</Text>
      <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
        {products.map((product) => {
          const totalStock = inventory
            .filter((i) => i.product_id === product.id)
            .reduce((sum, i) => sum + i.quantity, 0);

          return (
            <TouchableOpacity
              key={product.id}
              className="mb-3 flex-row items-center gap-3 rounded-xl p-4"
              style={{ backgroundColor: '#1F2937' }}
              onPress={() => {
                setSelectedProduct(product);
                setStep(2);
              }}
              activeOpacity={0.7}
            >
              <View className="h-12 w-12 items-center justify-center rounded-full bg-gray-700">
                <Feather name="package" color="#9CA3AF" size={24} />
              </View>
              <View className="flex-1">
                <Text className="font-medium text-white">{product.name}</Text>
                <Text className="text-sm text-gray-400">{product.category}</Text>
              </View>
              <View className="items-end">
                <Text className="text-lg font-bold text-white">{totalStock}</Text>
                <Text className="text-xs text-gray-400">available</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderSourceSelection = () => (
    <View className="px-4">
      <TouchableOpacity
        className="mb-4 flex-row items-center gap-2"
        onPress={() => setStep(1)}
      >
        <Feather name="arrow-left" color="#6B7280" size={16} />
        <Text className="text-sm text-gray-400">Back</Text>
      </TouchableOpacity>
      <Text className="text-lg font-semibold text-white">From Location</Text>
      <Text className="mt-1 text-sm text-gray-400">Select source location</Text>
      <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
        {locations.map((location) => {
          const stock = selectedProduct
            ? getLocationStock(selectedProduct.id, location.id)
            : 0;

          return (
            <TouchableOpacity
              key={location.id}
              className="mb-3 flex-row items-center gap-3 rounded-xl p-4"
              style={{ backgroundColor: '#1F2937' }}
              onPress={() => {
                setSourceLocation(location);
                setStep(3);
              }}
              activeOpacity={0.7}
              disabled={stock === 0}
            >
              <View
                className="h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: '#374151' }}
              >
                <Feather name="map-pin" color={stock > 0 ? '#0EA5E9' : '#6B7280'} size={24} />
              </View>
              <View className="flex-1">
                <Text className="font-medium text-white">{location.name}</Text>
                <Text className="text-sm text-gray-400">
                  {stock > 0 ? `${stock} units available` : 'No stock'}
                </Text>
              </View>
              {stock > 0 && <Feather name="arrow-right" color="#6B7280" size={20} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderTargetSelection = () => (
    <View className="px-4">
      <TouchableOpacity
        className="mb-4 flex-row items-center gap-2"
        onPress={() => setStep(2)}
      >
        <Feather name="arrow-left" color="#6B7280" size={16} />
        <Text className="text-sm text-gray-400">Back</Text>
      </TouchableOpacity>
      <Text className="text-lg font-semibold text-white">To Location</Text>
      <Text className="mt-1 text-sm text-gray-400">Select target location</Text>

      {/* Summary Card */}
      <View className="mt-4 rounded-xl p-4" style={{ backgroundColor: '#1F2937' }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Feather name="package" color="#0EA5E9" size={20} />
            <Text className="font-medium text-white">{selectedProduct?.name}</Text>
          </View>
          <View className="items-end">
            <Text className="text-sm text-gray-400">From:</Text>
            <Text className="font-medium text-white">{sourceLocation?.name}</Text>
          </View>
        </View>
      </View>

      <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
        {locations
          .filter((l) => l.id !== sourceLocation?.id)
          .map((location) => (
            <TouchableOpacity
              key={location.id}
              className="mb-3 flex-row items-center gap-3 rounded-xl p-4"
              style={{ backgroundColor: '#1F2937' }}
              onPress={() => setTargetLocation(location)}
              activeOpacity={0.7}
            >
              <View
                className="h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: '#374151' }}
              >
                <Feather name="map-pin" color="#10B981" size={24} />
              </View>
              <View className="flex-1">
                <Text className="font-medium text-white">{location.name}</Text>
                <Text className="text-sm text-gray-400">
                  Current: {selectedProduct ? getLocationStock(selectedProduct.id, location.id) : 0} units
                </Text>
              </View>
              {targetLocation?.id === location.id && (
                <View className="h-6 w-6 items-center justify-center rounded-full bg-green-500">
                  <Feather name="check" color="#FFFFFF" size={16} />
                </View>
              )}
            </TouchableOpacity>
          ))}
      </ScrollView>

      {/* Quantity Selector */}
      <View className="mt-4">
        <Text className="text-sm font-medium text-gray-400">Quantity</Text>
        <View className="mt-2 flex-row items-center gap-4">
          <TouchableOpacity
            className="h-12 w-12 items-center justify-center rounded-xl bg-gray-800"
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Text className="text-2xl text-white">-</Text>
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text className="text-3xl font-bold text-white">{quantity}</Text>
          </View>
          <TouchableOpacity
            className="h-12 w-12 items-center justify-center rounded-xl bg-gray-800"
            onPress={() => {
              const max = selectedProduct && sourceLocation
                ? getLocationStock(selectedProduct.id, sourceLocation.id)
                : 1;
              setQuantity(Math.min(max, quantity + 1));
            }}
          >
            <Text className="text-2xl text-white">+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Transfer Button */}
      <TouchableOpacity
        className="mt-6 items-center rounded-xl py-4"
        style={{ backgroundColor: targetLocation ? '#10B981' : '#374151' }}
        onPress={handleTransfer}
        disabled={!targetLocation}
        activeOpacity={0.8}
      >
        <Text className="text-lg font-semibold text-white">
          Transfer {quantity} unit{quantity > 1 ? 's' : ''}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-900">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" color="#9CA3AF" size={24} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-white">Transfer Stock</Text>
        <View style={{ width: 24 }} />
      </View>

      {renderStepIndicator()}

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-8"
      >
        {step === 1 && renderProductSelection()}
        {step === 2 && renderSourceSelection()}
        {step === 3 && renderTargetSelection()}
      </ScrollView>
    </View>
  );
}

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getProductInsights } from '../services/productInsights';
import { supabase } from '../lib/supabase';

const formatCurrency = (amount: number): string => {
  return `₦${amount.toLocaleString()}`;
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  
  // Editable fields
  const [retailPrice, setRetailPrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [priceChangeReason, setPriceChangeReason] = useState('');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setProduct(data);
      setRetailPrice(data.retail_price.toString());
      setWholesalePrice(data.wholesale_price.toString());
      setCostPrice(data.cost_price?.toString() || '');
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.alert('Error', 'Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePrice = async () => {
    try {
      setIsSaving(true);
      
      const { data: userData } = await supabase.auth.getUser();
      
      // Update product
      const updatedProduct = {
        retail_price: parseFloat(retailPrice),
        wholesale_price: parseFloat(wholesalePrice),
        cost_price: costPrice ? parseFloat(costPrice) : null,
      };

      const { error } = await supabase
        .from('products')
        .update(updatedProduct)
        .eq('id', id);

      if (error) throw error;

      // Log price history
      await supabase.from('price_history').insert({
        product_id: id,
        old_retail_price: product.retail_price,
        new_retail_price: parseFloat(retailPrice),
        old_wholesale_price: product.wholesale_price,
        new_wholesale_price: parseFloat(wholesalePrice),
        changed_by: userData.user?.id,
        reason: priceChangeReason,
        created_at: Date.now(),
      });

      Alert.alert('Success', 'Price updated successfully!');
      fetchProduct();
      setPriceChangeReason('');
    } catch (error) {
      console.error('Error saving price:', error);
      Alert.alert('Error', 'Failed to update price');
    } finally {
      setIsSaving(false);
    }
  };

  const fetchInsights = async () => {
    try {
      setInsightsLoading(true);
      const data = await getProductInsights({
        name: product.name,
        manufacturer: product.manufacturer,
        category: product.category,
        currentPrice: parseFloat(retailPrice),
        currency: 'NGN',
      });
      setInsights(data);
      setShowInsights(true);
    } catch (error) {
      console.error('Error fetching insights:', error);
      Alert.alert('Error', 'Failed to load insights');
    } finally {
      setInsightsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <ActivityIndicator color="#0EA5E9" size="large" />
        <Text className="text-zinc-400 mt-4">Loading product...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-zinc-950">
      {/* Header */}
      <View className="px-4 pt-12 pb-6">
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Product Details</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Product Header */}
        <View className="flex-row gap-4 mb-6">
          <View className="h-32 w-32 rounded-2xl bg-zinc-800 overflow-hidden">
            {product.image_url ? (
              <Image
                source={{ uri: product.image_url }}
                className="h-full w-full"
                resizeMode="cover"
              />
            ) : (
              <View className="h-full w-full items-center justify-center">
                <Feather name="box" size={40} color="#71717A" />
              </View>
            )}
          </View>
          <View className="flex-1 justify-center">
            <Text className="text-2xl font-bold text-white mb-2">{product.name}</Text>
            <Text className="text-zinc-400 mb-1">{product.sku}</Text>
            {product.category && (
              <View className="mt-2">
                <View className="px-3 py-1 rounded-full bg-zinc-800 self-start">
                  <Text className="text-sm text-zinc-300">{product.category}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Price Management Section */}
      <View className="px-4 mb-6">
        <View className="rounded-3xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-6">
          <View className="flex-row items-center gap-2 mb-6">
            <Feather name="dollar-sign" size={20} color="#0EA5E9" />
            <Text className="text-lg font-bold text-white">Price Management</Text>
          </View>

          {/* Retail Price */}
          <View className="mb-4">
            <Text className="text-zinc-400 text-sm mb-2">Retail Price</Text>
            <TextInput
              className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-xl font-bold"
              value={retailPrice}
              onChangeText={setRetailPrice}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>

          {/* Wholesale Price */}
          <View className="mb-4">
            <Text className="text-zinc-400 text-sm mb-2">Wholesale Price</Text>
            <TextInput
              className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-xl font-bold"
              value={wholesalePrice}
              onChangeText={setWholesalePrice}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>

          {/* Cost Price */}
          <View className="mb-4">
            <Text className="text-zinc-400 text-sm mb-2">Cost Price (Optional)</Text>
            <TextInput
              className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-xl font-bold"
              value={costPrice}
              onChangeText={setCostPrice}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>

          {/* Price Change Reason */}
          <View className="mb-6">
            <Text className="text-zinc-400 text-sm mb-2">Reason for Price Change (Optional)</Text>
            <TextInput
              className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white"
              value={priceChangeReason}
              onChangeText={setPriceChangeReason}
              placeholder="e.g., Supplier cost increase"
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            className="bg-[#0EA5E9] rounded-xl py-4 items-center justify-center"
            onPress={handleSavePrice}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-lg">Update Price</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* AI Insights Section */}
      <View className="px-4 mb-6">
        <TouchableOpacity
          className="rounded-3xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 p-6 mb-4"
          onPress={fetchInsights}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Feather name="brain" size={20} color="#10B981" />
              <Text className="text-lg font-bold text-white">AI Price Insights</Text>
            </View>
            {insightsLoading ? (
              <ActivityIndicator color="#10B981" />
            ) : (
              <Feather name={showInsights ? "chevron-up" : "chevron-down"} size={20} color="#71717A" />
            )}
          </View>
        </TouchableOpacity>

        {showInsights && insights && (
          <View className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6">
            {/* Price Comparison */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-white mb-4">Price Comparison</Text>
              
              <View className="space-y-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-zinc-400">Your Price</Text>
                  <Text className="text-white font-bold">{formatCurrency(parseFloat(retailPrice))}</Text>
                </View>
                {insights.priceComparison.manufacturerPrice && (
                  <View className="flex-row justify-between items-center">
                    <Text className="text-zinc-400">Manufacturer Suggested</Text>
                    <Text className="text-emerald-400 font-bold">
                      {formatCurrency(insights.priceComparison.manufacturerPrice)}
                    </Text>
                  </View>
                )}
                {insights.priceComparison.marketAveragePrice && (
                  <View className="flex-row justify-between items-center">
                    <Text className="text-zinc-400">Market Average</Text>
                    <Text className="text-blue-400 font-bold">
                      {formatCurrency(insights.priceComparison.marketAveragePrice)}
                    </Text>
                  </View>
                )}
                {insights.priceComparison.savingsPotential && (
                  <View className="flex-row justify-between items-center pt-2 border-t border-zinc-800">
                    <Text className="text-zinc-400">Savings Potential</Text>
                    <Text className="text-amber-400 font-bold">
                      {formatCurrency(insights.priceComparison.savingsPotential)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Repurchase Recommendation */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-white mb-4">Repurchase Recommendation</Text>
              <View className="p-4 rounded-xl bg-zinc-800">
                <View className="flex-row items-center gap-3 mb-3">
                  <View className={`w-3 h-3 rounded-full ${insights.repurchaseRecommendation.shouldRepurchase ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <Text className="text-white font-semibold">
                    {insights.repurchaseRecommendation.shouldRepurchase ? 'Recommend Repurchasing' : 'Hold Off on Repurchasing'}
                  </Text>
                </View>
                <Text className="text-zinc-400 text-sm mb-3">{insights.repurchaseRecommendation.reason}</Text>
                {insights.repurchaseRecommendation.optimalQuantity && (
                  <View className="flex-row justify-between items-center">
                    <Text className="text-zinc-400">Optimal Quantity</Text>
                    <Text className="text-white font-bold">{insights.repurchaseRecommendation.optimalQuantity} units</Text>
                  </View>
                )}
                {insights.repurchaseRecommendation.estimatedCost && (
                  <View className="flex-row justify-between items-center mt-2">
                    <Text className="text-zinc-400">Estimated Cost</Text>
                    <Text className="text-emerald-400 font-bold">
                      {formatCurrency(insights.repurchaseRecommendation.estimatedCost)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Market Insights */}
            <View>
              <Text className="text-lg font-bold text-white mb-4">Market Trends</Text>
              {insights.marketDemand && (
                <View className="mb-3">
                  <Text className="text-zinc-400 text-sm mb-1">Market Demand</Text>
                  <Text className="text-white">{insights.marketDemand}</Text>
                </View>
              )}
              {insights.seasonalTrends && (
                <View>
                  <Text className="text-zinc-400 text-sm mb-1">Seasonal Trends</Text>
                  <Text className="text-white">{insights.seasonalTrends}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Price History */}
      <View className="px-4 mb-8 pb-8">
        <View className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6">
          <View className="flex-row items-center gap-2 mb-6">
            <Feather name="clock" size={20} color="#A855F7" />
            <Text className="text-lg font-bold text-white">Price History</Text>
          </View>

          <View className="space-y-4">
            <PriceHistoryItem
              date="15 Jun 2026"
              oldPrice="₦1,500"
              newPrice="₦1,800"
              reason="Supplier cost increase"
            />
            <PriceHistoryItem
              date="01 Jun 2026"
              oldPrice="₦1,200"
              newPrice="₦1,500"
              reason="Market price adjustment"
            />
            <PriceHistoryItem
              date="15 May 2026"
              oldPrice="₦1,000"
              newPrice="₦1,200"
              reason="Initial launch pricing"
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function PriceHistoryItem({ date, oldPrice, newPrice, reason }: { date: string, oldPrice: string, newPrice: string, reason: string }) {
  const priceIncreased = parseFloat(newPrice.replace(/[^0-9]/g, '')) > parseFloat(oldPrice.replace(/[^0-9]/g, ''));
  
  return (
    <View className="p-4 rounded-2xl bg-zinc-800">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-zinc-400 text-sm">{date}</Text>
        <View className="flex-row items-center gap-2">
          <Text className="text-zinc-500 line-through">{oldPrice}</Text>
          <Feather name="arrow-right" size={12} color="#71717A" />
          <Text className={`font-bold ${priceIncreased ? 'text-red-400' : 'text-emerald-400'}`}>
            {newPrice}
          </Text>
        </View>
      </View>
      <Text className="text-zinc-400 text-sm">{reason}</Text>
    </View>
  );
}

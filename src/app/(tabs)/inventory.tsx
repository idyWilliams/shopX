import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabaseMock } from '../../services/supabaseMock';
import type { Product, Location, Inventory } from '../../types';

interface InventoryItem {
  product: Product;
  totalQuantity: number;
  quantitiesByLocation: { [key: string]: number };
}

const LOCATIONS = [
  { id: 'all', name: 'All Locations' },
  { id: 'lekki', name: 'Lekki Suite' },
  { id: 'ikeja', name: 'Ikeja Branch' },
  { id: 'vi', name: 'Victoria Island' },
];

interface ExchangeRates {
  NGN_TO_USD: number;
  NGN_TO_GBP: number;
}

const useExchangeRates = (): ExchangeRates => {
  // Simulated async FX rates with realistic values
  return {
    NGN_TO_USD: 0.00067,
    NGN_TO_GBP: 0.00052,
  };
};

const formatCurrency = (amount: number, currency: string): string => {
  const currencySymbols: Record<string, string> = {
    NGN: '₦',
    USD: '$',
    GBP: '£',
  };

  const symbol = currencySymbols[currency] || '₦';

  if (isNaN(amount)) {
    return `${symbol}0.00`;
  }

  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: currency !== 'NGN' ? 2 : 0,
    maximumFractionDigits: currency !== 'NGN' ? 2 : 0,
  })}`;
};

const calculateFX = (amount: number, fromCurrency: string, toCurrency: string, rates: ExchangeRates): number => {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  if (fromCurrency === 'NGN' && toCurrency === 'USD') {
    return amount * rates.NGN_TO_USD;
  }
  if (fromCurrency === 'NGN' && toCurrency === 'GBP') {
    return amount * rates.NGN_TO_GBP;
  }
  return amount;
};

export default function InventoryScreen() {
  const [activeLocation, setActiveLocation] = useState('all');
  const rates = useExchangeRates();

  const products = supabaseMock.getProducts();
  const inventory = supabaseMock.getInventory();
  const locations = supabaseMock.getLocations();

  const locationMap = useMemo(() => {
    const map: { [key: string]: string } = {};
    LOCATIONS.forEach((loc, idx) => {
      if (idx === 0) return;
      if (loc.id === 'lekki') {
        map[loc.id] = locations[1].id;
      } else if (loc.id === 'ikeja') {
        map[loc.id] = locations[2].id;
      } else if (loc.id === 'vi') {
        map[loc.id] = locations[0].id;
      }
    });
    return map;
  }, [locations]);

  const inventoryByProduct = useMemo(() => {
    const map: { [key: string]: InventoryItem } = {};
    products.forEach((product) => {
      map[product.id] = {
        product,
        totalQuantity: 0,
        quantitiesByLocation: {},
      };
    });

    inventory.forEach((inv) => {
      const item = map[inv.product_id];
      if (item) {
        item.totalQuantity += inv.quantity;
        item.quantitiesByLocation[inv.location_id] = inv.quantity;
      }
    });

    return map;
  }, [products, inventory]);

  const { totalAssetValue, projectedRevenue, averageMargin } = useMemo(() => {
    let totalAsset = 0;
    let totalRevenue = 0;

    Object.values(inventoryByProduct).forEach(({ product, totalQuantity }) => {
      totalAsset += product.cost_price * totalQuantity;
      totalRevenue += product.selling_price * totalQuantity;
    });

    let margin = 0;
    if (totalRevenue > 0) {
      margin = Math.round(((totalRevenue - totalAsset) / totalRevenue) * 100);
    }

    return {
      totalAssetValue: totalAsset,
      projectedRevenue: totalRevenue,
      averageMargin: margin,
    };
  }, [inventoryByProduct]);

  const filteredProducts = useMemo(() => {
    if (activeLocation === 'all') {
      return Object.values(inventoryByProduct);
    }

    const locationId = locationMap[activeLocation];
    return Object.values(inventoryByProduct).filter((item) =>
      item.quantitiesByLocation[locationId] &&
      item.quantitiesByLocation[locationId] > 0
    );
  }, [inventoryByProduct, activeLocation, locationMap]);

  const getStockBadgeStyle = (qty: number) => {
    if (qty < 5) {
      return {
        bg: 'bg-red-500/20',
        text: 'text-red-400',
        border: 'border-red-500/30',
      };
    }
    return {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
    };
  };

  const renderItem = ({ item }: { item: InventoryItem }) => {
    const { product, totalQuantity } = item;
    const badgeStyle = getStockBadgeStyle(totalQuantity);
    const baseCurrency = product.base_currency || 'NGN';

    const sellingPriceUSD = calculateFX(product.selling_price, baseCurrency, 'USD', rates);
    const sellingPriceGBP = calculateFX(product.selling_price, baseCurrency, 'GBP', rates);

    return (
      <View className="mx-4 mb-4 rounded-3xl bg-zinc-900 border border-zinc-800 p-5">
        <View className="flex-row gap-4">
          <View className="h-24 w-24 overflow-hidden rounded-2xl bg-zinc-800">
            {product.image_url ? (
              <Image
                source={{ uri: product.image_url }}
                className="h-full w-full"
                resizeMode="cover"
              />
            ) : (
              <View className="h-full w-full items-center justify-center">
                <Feather name="box" size={32} color="#71717A" />
              </View>
            )}
          </View>
          <View className="flex-1">
            <View className="flex-row items-start justify-between">
              <View>
                <Text className="text-base font-bold text-zinc-50">
                  {product.name}
                </Text>
                <Text className="text-sm text-zinc-500 mt-1">
                  {product.category}
                </Text>
              </View>
              <View
                className={`px-3 py-1 rounded-xl border ${badgeStyle.bg} ${badgeStyle.border}`}
              >
                <Text className={`text-sm font-bold ${badgeStyle.text}`}>
                  {totalQuantity} units
                </Text>
              </View>
            </View>

            <View className="mt-4">
              <Text className="text-2xl font-bold text-zinc-50">
                {formatCurrency(product.selling_price, baseCurrency)}
              </Text>
              <Text className="text-sm text-zinc-400 mt-1">
                ≈ {formatCurrency(sellingPriceUSD, 'USD')} | {formatCurrency(sellingPriceGBP, 'GBP')}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const totalAssetValueUSD = calculateFX(totalAssetValue, 'NGN', 'USD', rates);
  const totalAssetValueGBP = calculateFX(totalAssetValue, 'NGN', 'GBP', rates);

  return (
    <View className="flex-1 bg-zinc-950">
      {/* Header with Business Health FX Ledger */}
      <View className="px-4 pt-4 pb-6">
        <Text className="text-2xl font-bold text-zinc-50 mb-6">
          Inventory Matrix
        </Text>

        <View className="rounded-3xl bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20 p-6">
          <View className="flex-row items-center gap-2 mb-4">
            <Feather name="trending-up" size={20} color="#06B6D4" />
            <Text className="text-sm font-semibold text-cyan-400">
              Business Health FX Ledger
            </Text>
          </View>

          <View>
            <Text className="text-xs text-zinc-400 mb-1">Total Asset Value</Text>
            <Text className="text-3xl font-bold text-zinc-50">
              {formatCurrency(totalAssetValue, 'NGN')}
            </Text>

            <View className="flex-row gap-2 mt-2">
              <View className="rounded-full bg-zinc-800 px-3 py-1">
                <Text className="text-xs font-medium text-zinc-300">
                  ≈ {formatCurrency(totalAssetValueUSD, 'USD')}
                </Text>
              </View>
              <View className="rounded-full bg-zinc-800 px-3 py-1">
                <Text className="text-xs font-medium text-zinc-300">
                  ≈ {formatCurrency(totalAssetValueGBP, 'GBP')}
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-4 pt-4 border-t border-zinc-800">
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-zinc-400">Average Profit Margin</Text>
              <Text className="text-xl font-bold text-amber-400">
                {averageMargin}%
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Location Filter Pills */}
      <View className="mb-4">
        <FlatList
          data={LOCATIONS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-4"
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              className={`mr-3 px-5 py-2.5 rounded-full border ${
                activeLocation === item.id
                  ? 'bg-emerald-600 border-emerald-600'
                  : 'bg-zinc-900 border-zinc-800'
              }`}
              onPress={() => setActiveLocation(item.id)}
              activeOpacity={0.8}
            >
              <Text
                className={`text-sm font-semibold ${
                  activeLocation === item.id ? 'text-white' : 'text-zinc-400'
                }`}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Smart Multi-Currency Inventory List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderItem}
        keyExtractor={(item) => item.product.id}
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Feather name="package" size={48} color="#374151" />
            <Text className="mt-4 text-zinc-500 text-base">
              No stock in this location
            </Text>
          </View>
        }
      />
    </View>
  );
}

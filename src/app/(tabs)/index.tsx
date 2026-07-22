import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Dimensions, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Q } from '@nozbe/watermelondb';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, FadeInDown, FadeInUp, FadeOutDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';
import { useShift } from '../../context/ShiftContext';
import { syncData } from '../../lib/sync';
import { getDatabase } from '../../db';
import { Product } from '../../db/models/Product';
import { SalesEvent } from '../../db/models/SalesEvent';
import { createPendingTransfer } from '../../services/PendingTransferService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type CartItem = {
  product: Product;
  quantity: number;
};

export default function RegisterScreen() {
  const { activeStoreId } = useAuth();
  const { activeShift } = useShift();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Bottom sheet state
  const isSheetOpen = useSharedValue(false);
  
  useEffect(() => {
    const loadProducts = async () => {
      const database = getDatabase();
      const allProducts = activeStoreId
        ? await database.get<Product>('products').query(Q.where('org_id', activeStoreId)).fetch()
        : [];
      setProducts(allProducts);
    };
    
    loadProducts();
  }, [activeStoreId]);

  const addToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          return prev;
        }
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item => item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
      }
      return prev.filter(item => item.product.id !== productId);
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotalAmount = cart.reduce((sum, item) => sum + (item.product.sellingPrice * item.quantity), 0);

  const processPayment = async (method: 'cash' | 'card' | 'transfer') => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    isSheetOpen.value = false;
    
    if (!activeStoreId) return;
    const database = getDatabase();
    const ticketId = Math.random().toString(36).slice(2, 11).toUpperCase();
    const saleTotal = cartTotalAmount;

    try {
      await database.write(async () => {
        // Create sales events for each item
        for (const item of cart) {
          await database.get<SalesEvent>('sales_events').create((event: SalesEvent) => {
            event.storeId = activeStoreId;
            event.ticketId = ticketId;
            event.productId = item.product.id;
            event.quantity = item.quantity;
            event.priceAtSale = item.product.sellingPrice;
            event.eventType = 'SALE';
            event.attendantId = activeShift?.attendantId ?? undefined;
            event.shiftId = activeShift?.id;
            event.paymentMethod = method;
          });
          
          const productToUpdate = await database.get<Product>('products').find(item.product.id);
          await productToUpdate.update((p: Product) => {
            p.stockQuantity -= item.quantity;
          });
        }
      });

      // If payment method is transfer, create a pending transfer
      if (method === 'transfer') {
        await createPendingTransfer(
          activeStoreId, 
          ticketId, 
          null, 
          saleTotal, 
          'NGN'
        );
      }
      
      const allProducts = await database.get<Product>('products').query(Q.where('org_id', activeStoreId)).fetch();
      setProducts(allProducts);
      setCart([]);
      await syncData();

      cart.forEach(item => {
        const remaining = item.product.stockQuantity - item.quantity;
        if (remaining <= 0) {
          Alert.alert('Product Sold Out!', `${item.product.name} is now out of stock.`);
        } else if (remaining < 5) {
          Alert.alert('Low Stock Warning', `${item.product.name} is running low (${remaining} left).`);
        }
      });
    } catch (err) {
      console.error('Failed to log sale:', err);
    }
  };

  const sheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: withSpring(isSheetOpen.value ? 0 : SCREEN_HEIGHT, { damping: 20, stiffness: 200 }) }],
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    const pointerEvents = isSheetOpen.value ? 'auto' : 'none';
    return {
      opacity: withTiming(isSheetOpen.value ? 0.6 : 0, { duration: 300 }),
      pointerEvents: pointerEvents as any,
    };
  });

  return (
    <SafeAreaView className="flex-1 bg-[#050505]" edges={['top']}>
      <View className="px-6 pt-4 pb-4 border-b border-white/5">
        <Text className="text-3xl font-extrabold text-white tracking-tight">Register</Text>
      </View>

      <View className="flex-1">
        <FlatList
          data={products}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const cartItem = cart.find(c => c.product.id === item.id);
            return (
              <Animated.View entering={FadeInDown.duration(400).delay(index * 50)} className="w-[48%] mb-4">
                <TouchableOpacity 
                  className={`bg-white/5 border p-4 rounded-3xl h-40 justify-between ${cartItem ? 'border-[#0ea5e9]' : 'border-white/5'}`} 
                  onPress={() => addToCart(item)}
                  activeOpacity={0.7}
                >
                  <View>
                    <Text className="text-lg font-bold text-white mb-1" numberOfLines={2}>{item.name}</Text>
                    <Text className={`text-sm ${item.stockQuantity <= 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                      {item.stockQuantity} in stock
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-end">
                    <Text className="text-lg font-black text-[#0ea5e9]">{item.baseCurrency} {item.sellingPrice}</Text>
                    {cartItem && (
                      <View className="bg-[#0ea5e9] h-8 w-8 rounded-full items-center justify-center shadow-lg shadow-sky-500/50">
                        <Text className="text-white font-bold">{cartItem.quantity}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20">
              <Feather name="package" size={48} color="#3f3f46" />
              <Text className="text-zinc-500 text-lg mt-4 font-medium">No products available</Text>
            </View>
          }
        />

        {/* Floating Cart Button */}
        {cart.length > 0 && (
          <Animated.View entering={FadeInUp.springify()} exiting={FadeOutDown} className="absolute bottom-6 w-full px-6">
            <TouchableOpacity 
              className="bg-[#0ea5e9] flex-row items-center justify-between p-5 rounded-3xl shadow-2xl shadow-sky-500/40"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                isSheetOpen.value = true;
              }}
              activeOpacity={0.9}
            >
              <View className="flex-row items-center gap-3">
                <View className="bg-white/20 h-10 w-10 rounded-full items-center justify-center">
                  <Feather name="shopping-cart" size={20} color="white" />
                </View>
                <Text className="text-white font-bold text-lg">{cartTotalCount} items</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-white font-black text-xl">NGN {cartTotalAmount.toLocaleString()}</Text>
                <Feather name="chevron-up" size={24} color="white" />
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Backdrop */}
      <Animated.View className="absolute inset-0 bg-black z-10" style={backdropStyle}>
        <Pressable className="flex-1" onPress={() => { isSheetOpen.value = false; }} />
      </Animated.View>

      {/* Checkout Bottom Sheet */}
      <Animated.View className="absolute bottom-0 left-0 right-0 bg-[#121212] rounded-t-[40px] px-6 pt-4 pb-12 z-20 shadow-2xl" style={sheetStyle}>
        <View className="w-12 h-1.5 bg-white/10 rounded-full self-center mb-6" />
        
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-black text-white">Current Sale</Text>
          <TouchableOpacity onPress={() => setCart([])}>
            <Text className="text-red-400 font-semibold">Clear</Text>
          </TouchableOpacity>
        </View>

        <View className="max-h-60 mb-6">
          <FlatList
            data={cart}
            keyExtractor={item => item.product.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View className="flex-row justify-between items-center py-3 border-b border-white/5">
                <View className="flex-1">
                  <Text className="text-white font-semibold text-lg">{item.product.name}</Text>
                  <Text className="text-zinc-500">{item.product.baseCurrency} {item.product.sellingPrice}</Text>
                </View>
                <View className="flex-row items-center gap-4">
                  <TouchableOpacity onPress={() => removeFromCart(item.product.id)} className="h-8 w-8 rounded-full bg-white/10 items-center justify-center">
                    <Feather name="minus" size={16} color="white" />
                  </TouchableOpacity>
                  <Text className="text-white font-bold text-lg w-6 text-center">{item.quantity}</Text>
                  <TouchableOpacity onPress={() => addToCart(item.product)} className="h-8 w-8 rounded-full bg-[#0ea5e9]/20 items-center justify-center">
                    <Feather name="plus" size={16} color="#0ea5e9" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>

        <View className="flex-row justify-between items-center mb-8 bg-white/5 p-4 rounded-2xl">
          <Text className="text-xl font-bold text-zinc-300">Total Due</Text>
          <Text className="text-2xl font-black text-[#0ea5e9]">NGN {cartTotalAmount.toLocaleString()}</Text>
        </View>

        <Text className="text-zinc-500 font-semibold mb-4 uppercase tracking-wider text-xs ml-2">Select Payment Method</Text>
        
        <View className="flex-row gap-3">
          <TouchableOpacity className="flex-1 bg-[#10b981] p-4 rounded-2xl items-center shadow-lg shadow-emerald-500/20" onPress={() => processPayment('cash')}>
            <Feather name="dollar-sign" size={24} color="white" className="mb-2" />
            <Text className="text-white font-bold mt-1">Cash</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-1 bg-[#3b82f6] p-4 rounded-2xl items-center shadow-lg shadow-blue-500/20" onPress={() => processPayment('card')}>
            <Feather name="credit-card" size={24} color="white" className="mb-2" />
            <Text className="text-white font-bold mt-1">POS</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-1 bg-[#8b5cf6] p-4 rounded-2xl items-center shadow-lg shadow-violet-500/20" onPress={() => processPayment('transfer')}>
            <Feather name="smartphone" size={24} color="white" className="mb-2" />
            <Text className="text-white font-bold mt-1">Transfer</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

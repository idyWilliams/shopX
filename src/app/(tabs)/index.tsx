import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Dimensions, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';
import { syncData } from '../../lib/sync';
import { database } from '../../db';
import { Product } from '../../db/models/Product';
import { SalesEvent } from '../../db/models/SalesEvent';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type CartItem = {
  product: Product;
  quantity: number;
};

export default function RegisterScreen() {
  const { activeStoreId, currentAttendant } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Bottom sheet state
  const isSheetOpen = useSharedValue(false);
  
  useEffect(() => {
    // Fetch products from WatermelonDB
    const loadProducts = async () => {
      // Create some dummy products if none exist
      await database.write(async () => {
        const existing = await database.get<Product>('products').query().fetch();
        if (existing.length === 0 && activeStoreId) {
          await database.get<Product>('products').create(p => {
            p.orgId = activeStoreId;
            p.name = 'Sample Item A';
            p.baseCurrency = 'NGN';
            p.costPrice = 1000;
            p.sellingPrice = 1500;
            p.stockQuantity = 50;
          });
          await database.get<Product>('products').create(p => {
            p.orgId = activeStoreId;
            p.name = 'Sample Item B';
            p.baseCurrency = 'NGN';
            p.costPrice = 2000;
            p.sellingPrice = 3000;
            p.stockQuantity = 30;
          });
        }
      });
      
      const allProducts = await database.get<Product>('products').query().fetch();
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
        if (existing.quantity >= product.stockQuantity) return prev; // Cannot add more than stock
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.sellingPrice * item.quantity), 0);

  const handleCompleteSalePress = () => {
    if (cart.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    isSheetOpen.value = true;
  };

  const processPayment = async (method: 'cash' | 'card' | 'transfer') => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    isSheetOpen.value = false;
    
    if (!activeStoreId) return;

    try {
      await database.write(async () => {
        // Log sale for each item
        for (const item of cart) {
          await database.get<SalesEvent>('sales_events').create(event => {
            event.storeId = activeStoreId;
            event.productId = item.product.id;
            event.quantity = item.quantity;
            event.priceAtSale = item.product.sellingPrice;
            event.eventType = 'sale';
            // Store payment method if schema supported it, or use eventType as proxy if needed.
            // Assuming 'sale' is enough, but we could add a payment_method column to SalesEvent later.
          });
          
          // Deduct inventory
          const productToUpdate = await database.get<Product>('products').find(item.product.id);
          await productToUpdate.update(p => {
            p.stockQuantity -= item.quantity;
          });
        }
      });
      
      // Update local product state to reflect new stock
      const allProducts = await database.get<Product>('products').query().fetch();
      setProducts(allProducts);
      
      // Clear cart
      setCart([]);

      // Trigger immediate sync
      syncData();

      // Check for low stock or sold out and alert
      cart.forEach(item => {
        const remaining = item.product.stockQuantity - item.quantity;
        if (remaining <= 0) {
          Alert.alert('Product Sold Out!', `${item.product.name} is now out of stock. All attendants have been notified.`);
        } else if (remaining < 5) {
          Alert.alert('Low Stock Warning', `${item.product.name} is running low (${remaining} left). All attendants have been notified.`);
        }
      });
    } catch (err) {
      console.error('Failed to log sale:', err);
    }
  };

  // Animated styles for bottom sheet
  const sheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: withSpring(isSheetOpen.value ? 0 : SCREEN_HEIGHT, { damping: 20, stiffness: 200 }) }],
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    const pointerEvents = isSheetOpen.value ? 'auto' : 'none';
    return {
      opacity: withSpring(isSheetOpen.value ? 0.6 : 0),
      pointerEvents: pointerEvents as any,
    };
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Register</Text>
      </View>

      <View style={styles.content}>
        {/* Product List */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>Available Products</Text>
          <FlatList
            data={products}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.productCard} onPress={() => addToCart(item)}>
                <View>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productStock}>{item.stockQuantity} in stock</Text>
                </View>
                <Text style={styles.productPrice}>{item.baseCurrency} {item.sellingPrice}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={{color: '#71717a'}}>No products available.</Text>}
          />
        </View>

        {/* Cart Summary */}
        <View style={styles.cartSection}>
          <Text style={styles.sectionTitle}>Current Sale</Text>
          <FlatList
            data={cart}
            keyExtractor={item => item.product.id}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <Text style={styles.cartItemText}>{item.quantity}x {item.product.name}</Text>
                <Text style={styles.cartItemText}>{item.product.baseCurrency} {item.product.sellingPrice * item.quantity}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={{color: '#71717a', textAlign: 'center', marginTop: 20}}>Cart is empty</Text>}
          />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalAmount}>NGN {cartTotal.toLocaleString()}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.checkoutButton, cart.length === 0 && styles.checkoutButtonDisabled]} 
            onPress={handleCompleteSalePress}
            disabled={cart.length === 0}
          >
            <Text style={styles.checkoutButtonText}>Complete Sale</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={styles.backdropPressable} onPress={() => { isSheetOpen.value = false; }} />
      </Animated.View>

      {/* Bottom Sheet */}
      <Animated.View style={[styles.bottomSheet, sheetStyle]}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>How did they pay?</Text>
        
        <TouchableOpacity style={[styles.paymentButton, styles.cashButton]} onPress={() => processPayment('cash')}>
          <Text style={styles.paymentButtonIcon}>💵</Text>
          <Text style={styles.paymentButtonText}>Cash</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.paymentButton, styles.posButton]} onPress={() => processPayment('card')}>
          <Text style={styles.paymentButtonIcon}>💳</Text>
          <Text style={styles.paymentButtonText}>POS Terminal</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.paymentButton, styles.transferButton]} onPress={() => processPayment('transfer')}>
          <Text style={styles.paymentButtonIcon}>📲</Text>
          <Text style={styles.paymentButtonText}>Direct Transfer</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fafafa' },
  content: { flex: 1, flexDirection: 'column' },
  productsSection: { flex: 1.2, padding: 16, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  cartSection: { flex: 1, padding: 16, paddingBottom: 110, backgroundColor: '#18181b' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#e4e4e7', marginBottom: 16 },
  productCard: { flex: 0.48, backgroundColor: '#27272a', padding: 16, borderRadius: 16, marginBottom: 16, height: 120, justifyContent: 'space-between' },
  productName: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  productStock: { fontSize: 12, color: '#a1a1aa', marginTop: 4 },
  productPrice: { fontSize: 16, fontWeight: 'bold', color: '#0ea5e9' },
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  cartItemText: { color: '#e4e4e7', fontSize: 16, fontWeight: '500' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, marginBottom: 24 },
  totalLabel: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  totalAmount: { fontSize: 20, fontWeight: 'bold', color: '#0ea5e9' },
  checkoutButton: { backgroundColor: '#0ea5e9', padding: 20, borderRadius: 16, alignItems: 'center' },
  checkoutButtonDisabled: { opacity: 0.5 },
  checkoutButtonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000000', zIndex: 10 },
  backdropPressable: { flex: 1 },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#18181b',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 48,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 20,
  },
  sheetHandle: { width: 48, height: 6, backgroundColor: '#3f3f46', borderRadius: 3, alignSelf: 'center', marginBottom: 32 },
  sheetTitle: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 40 },
  paymentButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 24, borderRadius: 24, marginBottom: 16 },
  paymentButtonIcon: { fontSize: 28, marginRight: 16 },
  paymentButtonText: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  cashButton: { backgroundColor: '#10b981' },
  posButton: { backgroundColor: '#3b82f6' },
  transferButton: { backgroundColor: '#8b5cf6' },
});

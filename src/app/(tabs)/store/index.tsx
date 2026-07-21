import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../../context/AuthContext';
import { useDailyDigest } from '../../../hooks/useDailyDigest';

const formatCurrency = (amount: number): string => {
  if (isNaN(amount)) {
    return '₦0';
  }
  return `₦${amount.toLocaleString()}`;
};

interface GridItem {
  id: string;
  title: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  screen: string;
  badge?: number;
}

const GRID_ITEMS: GridItem[] = [
  { id: 'lens', title: 'ShopX Lens', icon: 'camera', color: '#0EA5E9', screen: '/lens' },
  { id: 'alerts', title: 'Alerts & Notifications', icon: 'bell', color: '#EF4444', screen: '/settings/alerts', badge: 3 },
  { id: 'transfers', title: 'Pending Transfers', icon: 'dollar-sign', color: '#10B981', screen: '/store/pending-transfers' },
  { id: 'leads', title: 'Leads Tracker', icon: 'users', color: '#8B5CF6', screen: '/store/leads' },
  { id: 'staff', title: 'Staff & Attendants', icon: 'user-check', color: '#10B981', screen: '/settings/team' },
  { id: 'settings', title: 'Business Settings', icon: 'settings', color: '#6B7280', screen: '/settings' },
];

const trendingItems = [
  { id: 1, name: 'Premium Leather Slides', trend: '+45%' },
  { id: 2, name: 'Nike Air Max', trend: '+32%' },
  { id: 3, name: 'Cargo Pants', trend: '+28%' },
];

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

function AnimatedCount({ toValue = 0, duration = 1500 }) {
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    animatedValue.value = withTiming(toValue, { duration });
  }, [toValue, duration, animatedValue]);

  useEffect(() => {
    // Manually update state with a listener on the shared value
    const interval = setInterval(() => {
      setDisplayValue(Math.round(animatedValue.value));
      if (animatedValue.value === toValue) {
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [toValue, animatedValue]);

  return (
    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Text style={[styles.searchCountText]}>
        {displayValue}
      </Text>
    </View>
  );
}

const WidgetCard = ({ title, children, onPress, wide = false }: { title: string; children: React.ReactNode; onPress?: () => void; wide?: boolean }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    };
  });

  return (
    <AnimatedTouchableOpacity
      activeOpacity={1}
      style={[styles.insightCard, wide ? styles.insightCardWide : null, animatedStyle]}
      onPressIn={() => {
        scale.value = withSpring(0.97);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      onPress={onPress}
    >
      {title && (
        <Text style={styles.insightCardTitle}>{title}</Text>
      )}
      {children}
    </AnimatedTouchableOpacity>
  );
}

export default function StoreScreen() {
  const router = useRouter();
  const { activeStoreId, authorizedStores } = useAuth();
  const { digest, isLoading: digestLoading } = useDailyDigest();
  const activeStore = authorizedStores.find(s => s.id === activeStoreId);
  const storeName = activeStore?.name || 'My Business';

  const handlePress = (item: GridItem) => {
    router.push(item.screen);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{storeName}</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Active</Text>
          </View>
        </View>

        <Animated.ScrollView contentContainerStyle={styles.scrollContent}>
          {/* --- Daily Digest Section */}
          <Text style={styles.insightsTitle}>Daily Digest</Text>
          <WidgetCard title="Today's Summary" wide>
            {digestLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <ActivityIndicator size="large" color="#0EA5E9" />
              </View>
            ) : digest ? (
              <View style={{ gap: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontSize: 12, color: '#8E8E93', fontWeight: '500' }}>Total Sales</Text>
                    <Text style={{ fontSize: 28, fontWeight: '800', color: '#000000' }}>
                      {formatCurrency(digest.totalSalesAmount)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 12, color: '#8E8E93', fontWeight: '500' }}>Transactions</Text>
                    <Text style={{ fontSize: 28, fontWeight: '800', color: '#000000' }}>
                      {digest.numberOfTransactions}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1, backgroundColor: '#E5E7EB', borderRadius: 12, padding: 12 }}>
                    <Text style={{ fontSize: 12, color: '#4B5563', fontWeight: '500' }}>Shifts</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#10B981' }}>
                        {digest.shifts.clean} Clean
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#EF4444' }}>
                        {digest.shifts.discrepancyLocked} Issues
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Feather name="bar-chart-2" size={32} color="#3f3f46" />
                <Text style={{ color: '#71717a', marginTop: 8, fontSize: 14 }}>No data yet</Text>
              </View>
            )}
          </WidgetCard>

          {/* --- Demand & Web Insights Section */}
          <Text style={styles.insightsTitle}>Demand & Web Insights</Text>

          {/* 2x2 Grid */}
          <View style={styles.insightsGrid}>
            {/* Widget 1: Google Search Views */}
            <WidgetCard title="Google Search Views">
              <View style={styles.searchViewWidget}>
                <AnimatedCount toValue={240} duration={1500} />
                <Text style={styles.searchViewSubtitle}>People saw your products online this week</Text>
              </View>
            </WidgetCard>

            {/* Widget 2: Quick Stats (placeholder) */}
            <WidgetCard title="Conversion Rate">
              <View style={styles.quickStatWidget}>
                <Text style={styles.quickStatNumber}>84</Text>
                <Text style={styles.quickStatLabel}>Average daily sales</Text>
              </View>
            </WidgetCard>

            {/* Widget 3: Top Location */}
            <WidgetCard title="Top Location">
              <View style={styles.locationWidget}>
                <Feather name="map-pin" size={32} color="#0EA5E9" />
                <Text style={styles.locationText}>Lagos Island</Text>
                <Text style={styles.locationSubtitle}>Highest foot traffic</Text>
              </View>
            </WidgetCard>

            {/* Widget 4: Stock Alert */}
            <WidgetCard title="Stock Alerts">
              <View style={styles.stockAlertWidget}>
                <Feather name="alert-triangle" size={32} color="#EF4444" />
                <Text style={styles.stockAlertText}>2 products low stock</Text>
              </View>
            </WidgetCard>
          </View>

          {/* Widget 5: Trending in Your City */}
          <WidgetCard title="Trending in Your City" wide>
            <View style={styles.trendingWidget}>
              {trendingItems.map(item => (
                <View key={item.id} style={styles.trendingItem}>
                  <View style={styles.trendingLeft}>
                    <Text style={styles.trendingItemName}>{item.name}</Text>
                    <View style={styles.trendBadge}>
                      <Feather name="trending-up" size={12} color="#34C759" />
                      <Text style={styles.trendBadgeText}>{item.trend}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.sourceItButton}
                    onPress={() => router.push('/lens')}
                  >
                    <Feather name="shopping-cart" size={16} color="#FFFFFF" />
                    <Text style={styles.sourceItButtonText}>Source It</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </WidgetCard>

          {/* --- Tools Sections */}
          <Text style={styles.sectionTitle}>Operational Tools</Text>
          <View style={styles.grid}>
            {GRID_ITEMS.slice(0, 3).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.gridItem}
                onPress={() => handlePress(item)}
              >
                <View style={[styles.iconBackground, { backgroundColor: item.color + '20' }]}>
                  <Feather name={item.icon} size={24} color={item.color} />
                </View>
                <Text style={styles.gridItemTitle}>{item.title}</Text>
                {item.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Administrative Tools</Text>
          <View style={styles.grid}>
            {GRID_ITEMS.slice(3).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.gridItem}
                onPress={() => handlePress(item)}
              >
                <View style={[styles.iconBackground, { backgroundColor: item.color + '20' }]}>
                  <Feather name={item.icon} size={24} color={item.color} />
                </View>
                <Text style={styles.gridItemTitle}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 10,
    height: 10,
    backgroundColor: '#10B981',
    borderRadius: 5,
  },
  statusText: {
    color: '#A1A1AA',
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  insightsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    marginTop: 8,
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  insightCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  insightCardWide: {
    width: '100%',
  },
  insightCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  // Search View Widget
  searchViewWidget: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  searchCountText: {
    fontSize: 44,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
  },
  searchViewSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
    fontWeight: '500',
  },
  // Quick Stat Widget
  quickStatWidget: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  quickStatNumber: {
    fontSize: 40,
    fontWeight: '800',
    color: '#000000',
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
    fontWeight: '500',
  },
  // Location Widget
  locationWidget: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginTop: 12,
  },
  locationSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  // Stock Alert Widget
  stockAlertWidget: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  stockAlertText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginTop: 12,
    textAlign: 'center',
  },
  // Trending Items Widget
  trendingWidget: {
    gap: 16,
  },
  trendingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  trendingItemName: {
    color: '#1C1C1E',
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  trendBadgeText: {
    color: '#34C759',
    fontSize: 12,
    fontWeight: '700',
  },
  sourceItButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0EA5E9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  sourceItButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Grid for existing tools
  sectionTitle: {
    color: '#71717a',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    marginTop: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridItem: {
    width: '47%',
    backgroundColor: '#18181b',
    borderRadius: 20,
    padding: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  gridItemTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#EF4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

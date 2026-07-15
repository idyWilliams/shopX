import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSpring,
  withTiming,
  Easing,
  withSequence,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AI_STATES = [
  "Point at the product label...",
  "Hold still...",
  "Now flip to scan the bottom barcode...",
  "Analyzing manufacturer batch code...",
];

export default function ShopXLens() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [currentAiState, setCurrentAiState] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);
  const bottomSheetY = useSharedValue(SCREEN_HEIGHT);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    const stateInterval = setInterval(() => {
      if (currentAiState < AI_STATES.length - 1) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCurrentAiState(prev => prev + 1);
      } else {
        clearInterval(stateInterval);
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setScanComplete(true);
          bottomSheetY.value = withSpring(SCREEN_HEIGHT * 0.25, {
            damping: 20,
            stiffness: 150,
          });
        }, 1500);
      }
    }, 2000);

    return () => clearInterval(stateInterval);
  }, [currentAiState]);

  if (!permission) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <Text style={styles.textWhite}>Requesting camera permissions...</Text>
        </SafeAreaView>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Camera Access</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const animatedBottomSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bottomSheetY.value }],
  }));

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()}>
              <View style={styles.buttonBackground}>
                <Feather name="x" size={28} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.reticleContainer}>
            <Animated.View
              style={[
                styles.reticle,
                animatedPulseStyle,
              ]}
            />
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>
                {AI_STATES[currentAiState]}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </CameraView>

      <Animated.View style={[styles.bottomSheet, animatedBottomSheetStyle]}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetContent}>
          <View style={styles.badgeRow}>
            <Feather name="shield" size={24} color="#10B981" />
            <Text style={styles.badgeText}>Authentic Verified</Text>
          </View>

          <View style={styles.priceRow}>
            <View style={styles.priceBlock}>
              <Text style={styles.priceLabel}>Wholesale Ask</Text>
              <Text style={styles.priceValue}>₦35,000</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceBlock}>
              <Text style={styles.priceLabel}>Avg Online</Text>
              <Text style={styles.priceValue}>₦72,000</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceBlock}>
              <Text style={styles.priceLabel}>Est. Margin</Text>
              <Text style={[styles.priceValue, styles.greenText]}>+51%</Text>
            </View>
          </View>

          <View style={styles.insightsBlock}>
            <Feather name="trending-up" size={18} color="#0EA5E9" />
            <Text style={styles.insightsText}>
              Local demand is HIGH. 4 nearby stores are currently out of stock.
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  buttonBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reticle: {
    width: 200,
    height: 200,
    borderWidth: 3,
    borderColor: '#0EA5E9',
    borderRadius: 24,
  },
  statusPill: {
    marginTop: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  textWhite: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#0EA5E9',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT * 0.75,
    backgroundColor: '#18181b',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 16,
  },
  sheetHandle: {
    width: 48,
    height: 5,
    backgroundColor: '#3f3f46',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 8,
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 24,
    gap: 10,
  },
  badgeText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  priceBlock: {
    flex: 1,
    alignItems: 'center',
  },
  priceLabel: {
    color: '#71717a',
    fontSize: 12,
    marginBottom: 8,
  },
  priceValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  greenText: {
    color: '#10B981',
  },
  priceDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#3f3f46',
    marginHorizontal: 12,
  },
  insightsBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 12,
  },
  insightsText: {
    color: '#9ca3af',
    fontSize: 14,
    flex: 1,
  },
});

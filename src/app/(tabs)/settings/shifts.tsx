import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { database } from '../../../db';
import { Shift } from '../../../db/models/Shift';

const formatCurrency = (amount: number): string => {
  if (isNaN(amount)) {
    return '₦0';
  }
  return `₦${amount.toLocaleString()}`;
};

export default function ShiftsScreen() {
  const router = useRouter();
  const { activeStoreId } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadShifts = async () => {
    if (!activeStoreId) return;
    try {
      setIsLoading(true);
      const allShifts = await database.get<Shift>('shifts').query().fetch();
      const storeShifts = allShifts.filter(s => s.storeId === activeStoreId);
      // Sort by openedAt descending
      storeShifts.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
      setShifts(storeShifts);
    } catch (err) {
      console.error('Failed to load shifts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, [activeStoreId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-cyan-400';
      case 'clean':
        return 'text-emerald-400';
      case 'discrepancy_locked':
        return 'text-red-400';
      default:
        return 'text-zinc-400';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#06B6D4" />
          <Text className="text-zinc-400 mt-4">Loading shifts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <View className="px-6 pt-4 pb-6">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-zinc-800 mr-4">
            <Feather name="arrow-left" size={20} color="#A1A1AA" />
          </TouchableOpacity>
          <Text className="text-2xl font-black text-white">Shift History</Text>
        </View>

        {shifts.length === 0 ? (
          <View className="flex-1 items-center justify-center mt-20">
            <Feather name="clock" size={64} color="#3f3f46" />
            <Text className="text-zinc-500 text-lg mt-4 font-medium">No shifts yet</Text>
          </View>
        ) : (
          <FlatList
            data={shifts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="bg-zinc-900 p-4 rounded-2xl mb-4 border border-zinc-800">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-white font-bold text-lg">
                    {new Date(item.openedAt).toLocaleDateString()}
                  </Text>
                  <Text className={`text-xs uppercase tracking-wider font-semibold ${getStatusColor(item.status)}`}>
                    {item.status.replace('_', ' ')}
                  </Text>
                </View>
                <Text className="text-zinc-400 text-sm mb-1">
                  Opened: {new Date(item.openedAt).toLocaleTimeString()}
                </Text>
                {item.closedAt && (
                  <Text className="text-zinc-400 text-sm mb-3">
                    Closed: {new Date(item.closedAt).toLocaleTimeString()}
                  </Text>
                )}
                <Text className="text-zinc-500 text-sm">
                  Opening float: {formatCurrency(item.openingCashFloat)}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

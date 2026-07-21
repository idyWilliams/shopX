import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { database } from '../../../db';
import { PendingTransfer } from '../../../db/models/PendingTransfer';
import { confirmTransfer, failTransfer, getPendingTransfers } from '../../../services/PendingTransferService';

const formatCurrency = (amount: number): string => {
  if (isNaN(amount)) {
    return '₦0';
  }
  return `₦${amount.toLocaleString()}`;
};

export default function PendingTransfersScreen() {
  const router = useRouter();
  const { activeStoreId } = useAuth();
  const [transfers, setTransfers] = useState<PendingTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTransfers = async () => {
    if (!activeStoreId) return;
    try {
      setIsLoading(true);
      const pending = await getPendingTransfers(activeStoreId);
      setTransfers(pending);
    } catch (err) {
      console.error('Failed to load pending transfers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransfers();
  }, [activeStoreId]);

  const handleConfirm = async (transfer: PendingTransfer) => {
    Alert.alert(
      'Confirm Transfer',
      `Mark ${formatCurrency(transfer.amount)} as confirmed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'default',
          onPress: async () => {
            try {
              await confirmTransfer(transfer.id);
              await loadTransfers();
            } catch (err) {
              Alert.alert('Error', 'Failed to confirm transfer');
            }
          },
        },
      ]
    );
  };

  const handleFail = async (transfer: PendingTransfer) => {
    Alert.alert(
      'Mark as Failed',
      `Mark ${formatCurrency(transfer.amount)} as failed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Failed',
          style: 'destructive',
          onPress: async () => {
            try {
              await failTransfer(transfer.id);
              await loadTransfers();
            } catch (err) {
              Alert.alert('Error', 'Failed to update transfer');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#06B6D4" />
          <Text className="text-zinc-400 mt-4">Loading transfers...</Text>
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
          <Text className="text-2xl font-black text-white">Pending Transfers</Text>
        </View>

        {transfers.length === 0 ? (
          <View className="flex-1 items-center justify-center mt-20">
            <Feather name="check-circle" size={64} color="#3f3f46" />
            <Text className="text-zinc-500 text-lg mt-4 font-medium">No pending transfers</Text>
          </View>
        ) : (
          <FlatList
            data={transfers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="bg-zinc-900 p-4 rounded-2xl mb-4 border border-zinc-800">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-white font-bold text-lg">{formatCurrency(item.amount)}</Text>
                  <Text className="text-amber-400 text-xs uppercase tracking-wider font-semibold">
                    {item.status}
                  </Text>
                </View>
                {item.ticketId && (
                  <Text className="text-zinc-400 text-sm mb-3">Ticket: {item.ticketId}</Text>
                )}
                <Text className="text-zinc-500 text-xs mb-4">
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className="flex-1 bg-emerald-500/20 border border-emerald-500/30 p-3 rounded-xl items-center"
                    onPress={() => handleConfirm(item)}
                  >
                    <Feather name="check" size={18} color="#10B981" />
                    <Text className="text-emerald-400 font-semibold text-sm mt-1">Confirm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-red-500/20 border border-red-500/30 p-3 rounded-xl items-center"
                    onPress={() => handleFail(item)}
                  >
                    <Feather name="x" size={18} color="#EF4444" />
                    <Text className="text-red-400 font-semibold text-sm mt-1">Fail</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

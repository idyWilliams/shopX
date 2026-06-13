import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

const formatCurrency = (amount: number): string => {
  if (isNaN(amount)) {
    return '₦0';
  }
  return `₦${amount.toLocaleString()}`;
};

const parseCurrencyInput = (text: string): number => {
  const clean = text.replace(/[^0-9]/g, '');
  return clean ? parseInt(clean, 10) : 0;
};

export default function HandoverScreen() {
  const router = useRouter();
  const [declaredCash, setDeclaredCash] = useState('');
  const [declaredTransfers, setDeclaredTransfers] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<'success' | 'discrepancy' | null>(null);
  const [variance, setVariance] = useState(0);

  // Mock expected data
  const expectedCash = 50000;
  const expectedTransfers = 120000;
  const totalExpected = expectedCash + expectedTransfers;

  const handleSubmit = () => {
    setIsSubmitting(true);

    setTimeout(() => {
      const cash = parseCurrencyInput(declaredCash);
      const transfers = parseCurrencyInput(declaredTransfers);
      const totalDeclared = cash + transfers;
      const calculatedVariance = totalDeclared - totalExpected;

      setVariance(calculatedVariance);

      if (calculatedVariance >= 0) {
        setResult('success');
      } else {
        setResult('discrepancy');
      }

      setIsSubmitting(false);
    }, 1500);
  };

  const handleReset = () => {
    setDeclaredCash('');
    setDeclaredTransfers('');
    setResult(null);
    setVariance(0);
  };

  if (result) {
    return (
      <View className="flex-1 bg-zinc-950 px-6 pt-8 pb-20">
        {result === 'discrepancy' && (
          <View className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
            <View className="flex-row items-center gap-2 mb-2">
              <Feather name="alert-triangle" size={20} color="#F59E0B" />
              <Text className="text-sm font-semibold text-amber-400">
                Owner Notification: Discrepancy Alert
              </Text>
            </View>
            <Text className="text-zinc-300">
              Ikeja Branch shift closed with a {formatCurrency(variance)} shortfall. Review logs.
            </Text>
          </View>
        )}

        <View className="flex-1 items-center justify-center">
          <View
            className={`w-24 h-24 rounded-full items-center justify-center mb-6 ${
              result === 'success' ? 'bg-emerald-500/20' : 'bg-amber-500/20'
            }`}
          >
            <Feather
              name={result === 'success' ? 'check-circle' : 'alert-circle'}
              size={64}
              color={result === 'success' ? '#10B981' : '#F59E0B'}
            />
          </View>

          <Text className="text-2xl font-bold text-zinc-50 mb-2">
            {result === 'success' ? 'Shift Closed' : 'Shift Closed with Discrepancy'}
          </Text>

          <Text className="text-center text-zinc-400 mb-8">
            {result === 'success'
              ? 'Owner has been notified of shift closure.'
              : 'Owner has been alerted to review the discrepancy.'}
          </Text>

          <View className="w-full p-6 rounded-3xl bg-zinc-900 border border-zinc-800 mb-8">
            <Text className="text-xs text-zinc-500 mb-4 uppercase tracking-wider">
              Final Reconciliation
            </Text>

            <View className="flex-row justify-between mb-2">
              <Text className="text-zinc-400">Declared Cash</Text>
              <Text className="text-zinc-50 font-semibold">
                {formatCurrency(parseCurrencyInput(declaredCash))}
              </Text>
            </View>

            <View className="flex-row justify-between mb-2">
              <Text className="text-zinc-400">Declared Transfers</Text>
              <Text className="text-zinc-50 font-semibold">
                {formatCurrency(parseCurrencyInput(declaredTransfers))}
              </Text>
            </View>

            <View className="border-t border-zinc-800 my-4" />

            <View className="flex-row justify-between mb-2">
              <Text className="text-zinc-400">Total Declared</Text>
              <Text className="text-zinc-50 font-semibold">
                {formatCurrency(
                  parseCurrencyInput(declaredCash) + parseCurrencyInput(declaredTransfers)
                )}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-zinc-400">Total Expected</Text>
              <Text className="text-zinc-50 font-semibold">
                {formatCurrency(totalExpected)}
              </Text>
            </View>

            <View className="border-t border-zinc-800 my-4" />

            <View className="flex-row justify-between">
              <Text className="text-zinc-400">Variance</Text>
              <Text
                className={`font-bold ${
                  variance >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {variance >= 0 ? '+' : ''}
                {formatCurrency(variance)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            className="w-full py-5 rounded-2xl bg-zinc-800 active:opacity-80"
            onPress={handleReset}
          >
            <Text className="text-center font-semibold text-zinc-300">
              Submit Another Shift
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-zinc-950"
      contentContainerClassName="pt-8 pb-32"
    >
      <View className="px-6">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            className="h-10 w-10 items-center justify-center rounded-full bg-zinc-800 mr-4"
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={20} color="#A1A1AA" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-zinc-50">End of Shift</Text>
        </View>

        <View className="mb-8 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <View className="flex-row items-center gap-2 mb-1">
            <Feather name="map-pin" size={16} color="#71717A" />
            <Text className="text-xs text-zinc-500 uppercase tracking-wider">
              Ikeja Branch
            </Text>
          </View>
          <Text className="text-2xl font-bold text-zinc-50">
            Declare your takings
          </Text>
        </View>

        {/* Cash Input */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-zinc-400 mb-3">
            Total physical cash in drawer
          </Text>
          <View className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
            <View className="flex-row items-center gap-3">
              <Text className="text-3xl font-bold text-zinc-50">₦</Text>
              <TextInput
                className="flex-1 text-3xl font-bold text-zinc-50"
                placeholder="0"
                placeholderTextColor="#71717A"
                value={declaredCash}
                onChangeText={setDeclaredCash}
                keyboardType="number-pad"
                autoFocus
              />
            </View>
          </View>
        </View>

        {/* Transfer Input */}
        <View className="mb-8">
          <Text className="text-sm font-semibold text-zinc-400 mb-3">
            Total bank transfers received today
          </Text>
          <View className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
            <View className="flex-row items-center gap-3">
              <Text className="text-3xl font-bold text-zinc-50">₦</Text>
              <TextInput
                className="flex-1 text-3xl font-bold text-zinc-50"
                placeholder="0"
                placeholderTextColor="#71717A"
                value={declaredTransfers}
                onChangeText={setDeclaredTransfers}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <View className="mt-6">
          <TouchableOpacity
            className={`w-full py-6 rounded-3xl ${
              declaredCash && declaredTransfers
                ? 'bg-emerald-500 active:opacity-80'
                : 'bg-zinc-800'
            }`}
            onPress={handleSubmit}
            disabled={!declaredCash || !declaredTransfers || isSubmitting}
          >
            <View className="flex-row items-center justify-center gap-2">
              {isSubmitting ? (
                <>
                  <Feather name="loader" size={22} color="#FFFFFF" />
                  <Text className="text-lg font-bold text-white">
                    Submitting...
                  </Text>
                </>
              ) : (
                <>
                  <Feather name="send" size={22} color="#FFFFFF" />
                  <Text className="text-lg font-bold text-white">
                    Close Shift & Submit to Owner
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

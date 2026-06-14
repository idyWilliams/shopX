import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAnomalies, useSalesEvents } from '../db/hooks';
import { getDailyAnomalyReport } from '../services/anomalyEngine';
import { generateShiftSummary } from '../lib/whatsapp';
import { database } from '../db';
import { OperationalAnomaly } from '../db/models/OperationalAnomaly';

const OwnerDashboard: React.FC = () => {
  const anomalies = useAnomalies();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const dailyReport = await getDailyAnomalyReport();
        setReport(dailyReport);
      } catch (error) {
        console.error('Failed to fetch daily report:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [anomalies]);

  const handleShareReport = async () => {
    if (!report) return;
    const summary = generateShiftSummary(report, anomalies);
    
    // Check if Share API is available
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'ShopX Shift Report',
          text: summary,
        });
      } catch (error) {
        console.error('Error sharing report:', error);
        Alert.alert('Share Failed', 'Could not share the report');
      }
    } else {
      Alert.alert('Report Ready', summary, [{ text: 'OK' }]);
    }
  };

  const renderAnomalyItem = ({ item }: { item: OperationalAnomaly }) => {
    const severityColors = {
      low: '#10B981',
      medium: '#F59E0B',
      critical: '#EF4444',
    };

    return (
      <View className="p-4 mb-3 bg-zinc-900 rounded-2xl border border-zinc-800">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-sm font-semibold text-zinc-50 mb-1">
              {item.anomalyType}
            </Text>
            <Text className="text-xs text-zinc-400">
              {item.payload}
            </Text>
            <Text className="text-xs text-zinc-500 mt-2">
              {item.createdAt.toLocaleString()}
            </Text>
          </View>
          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: `${severityColors[item.severity]}20` }}
          >
            <Text
              className="text-xs font-bold"
              style={{ color: severityColors[item.severity] }}
            >
              {item.severity.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <Text className="text-zinc-400">Loading dashboard...</Text>
      </View>
    );
  }

  const healthColor = report?.shopHealth === 'balanced' ? '#10B981' : '#EF4444';
  const healthText = report?.shopHealth === 'balanced' ? 'Balanced' : 'Unbalanced';

  return (
    <View className="flex-1 bg-zinc-950">
      <View className="p-4 border-b border-zinc-800">
        <Text className="text-2xl font-bold text-zinc-50 mb-2">Owner Dashboard</Text>
        <Text className="text-sm text-zinc-400">Real-time shop health monitoring</Text>
      </View>

      <FlatList
        data={anomalies}
        keyExtractor={(item) => item.id}
        renderItem={renderAnomalyItem}
        contentContainerClassName="p-4"
        ListHeaderComponent={() => (
          <>
            <View className="mb-6 p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-semibold text-zinc-50">Daily Summary</Text>
                <TouchableOpacity
                  className="flex-row items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20"
                  onPress={handleShareReport}
                >
                  <Feather name="share-2" size={16} color="#0EA5E9" />
                  <Text className="text-sm font-semibold text-cyan-400">Share</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row justify-around">
                <View className="items-center">
                  <Text className="text-2xl font-bold text-zinc-50">
                    ₦{report?.totalSales?.toLocaleString() || 0}
                  </Text>
                  <Text className="text-xs text-zinc-400 mt-1">Total Sales</Text>
                </View>

                <View className="items-center">
                  <View
                    className="w-8 h-8 rounded-full mb-1 items-center justify-center"
                    style={{ backgroundColor: `${healthColor}20` }}
                  >
                    <Feather
                      name={report?.shopHealth === 'balanced' ? 'check' : 'alert-triangle'}
                      size={16}
                      color={healthColor}
                    />
                  </View>
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: healthColor }}
                  >
                    {healthText}
                  </Text>
                </View>

                <View className="items-center">
                  <Text className="text-2xl font-bold text-zinc-50">
                    {anomalies.length}
                  </Text>
                  <Text className="text-xs text-zinc-400 mt-1">Anomalies</Text>
                </View>
              </View>
            </View>

            <Text className="text-lg font-semibold text-zinc-50 mb-3">Anomaly Feed</Text>
          </>
        )}
        ListEmptyComponent={() => (
          <View className="py-10 items-center">
            <Feather name="check-circle" size={48} color="#10B981" />
            <Text className="text-base font-semibold text-zinc-50 mt-4">
              All clear! No anomalies found.
            </Text>
            <Text className="text-sm text-zinc-400 mt-2 text-center">
              Your shop is running smoothly today
            </Text>
          </View>
        )}
      />
    </View>
  );
};

export default OwnerDashboard;

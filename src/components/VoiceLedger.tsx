import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { supabase } from '../lib/supabase';
import { getDatabase } from '../db';
import { SalesEvent } from '../db/models/SalesEvent';
import { OperationalAnomaly } from '../db/models/OperationalAnomaly';
import { Product } from '../db/models/Product';
import { useAuth } from '../context/AuthContext';

const logDataIntegrityAnomaly = async (command: string, details: any, storeId: string | null) => {
  const db = getDatabase();
  await db.write(async () => {
    await db.get<OperationalAnomaly>('operational_anomalies').create((anomaly) => {
      anomaly.anomalyType = 'DATA_INTEGRITY_VIOLATION';
      anomaly.severity = 'medium';
      anomaly.storeId = storeId ?? '';
      anomaly.payload = JSON.stringify({ command, details, timestamp: new Date().toISOString() });
      anomaly.createdAt = new Date();
    });
  });
};

const VoiceLedger: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [confirmed, setConfirmed] = useState<any>(null);
  const { activeStoreId, currentAttendant } = useAuth();

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Recording Error', 'Could not start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);

    if (uri) {
      await processVoiceCommand(uri);
    }
  };

  const processVoiceCommand = async (audioUri: string) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-voice-command', {
        body: { audioUri },
      });

      if (error) throw error;

      const db = getDatabase();
      // Validate data integrity: check for valid SKU or product
      const products = await db.get<Product>('products').query().fetch();
      const productExists = products.some(p => 
        p.name.toLowerCase().includes(data.productName?.toLowerCase() || '')
      );

      if (!productExists && data.productName) {
        await logDataIntegrityAnomaly(audioUri, {
          invalidProduct: data.productName,
          reason: 'Product not found in inventory'
        }, activeStoreId);
        Alert.alert('Validation Error', 'Product not recognized. Please try again.');
        return;
      }

      setConfirmed(data);
    } catch (error) {
      console.error('Error processing voice command:', error);
      Alert.alert('Error', 'Could not process voice command');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmAndSave = async () => {
    if (!confirmed) return;
    setIsProcessing(true);

    try {
      const db = getDatabase();
      await db.write(async () => {
        await db.get<SalesEvent>('sales_events').create((event) => {
          event.storeId = activeStoreId ?? '';
          event.eventType = confirmed.action;
          event.quantity = confirmed.quantity;
          event.priceAtSale = confirmed.price || 0;
          event.attendantId = currentAttendant?.id ?? '';
          event.createdAt = new Date();
        });
      });

      Alert.alert('Success', 'Sales event saved!');
      setConfirmed(null);
    } catch (error) {
      console.error('Error saving sales event:', error);
      Alert.alert('Error', 'Could not save sales event');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View className="flex-1 bg-zinc-950 p-6">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-zinc-50 mb-1">
          Voice Ledger
        </Text>
        <Text className="text-sm text-zinc-400">
          Speak your transactions naturally
        </Text>
        {activeStoreId && (
          <Text className="text-xs text-cyan-400 mt-2">
          Active Store: {activeStoreId}
          </Text>
        )}
      </View>

      {!confirmed ? (
        <View className="flex-1 items-center justify-center">
          <TouchableOpacity
            className={`w-40 h-40 rounded-full items-center justify-center mb-6 ${
              isRecording ? 'bg-red-500' : 'bg-cyan-500'
            }`}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="large" color="white" />
            ) : (
              <Feather
                name={isRecording ? 'square' : 'mic'}
                size={64}
                color="white"
              />
            )}
          </TouchableOpacity>

          <Text className="text-lg font-semibold text-zinc-50">
            {isProcessing ? 'Processing...' : isRecording ? 'Recording...' : 'Tap to Record'}
          </Text>

          <Text className="text-sm text-zinc-400 mt-2 text-center">
            Try saying: "Sold 2 rice at 500 each"
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          <View className="p-5 bg-zinc-900 rounded-2xl border border-zinc-800 mb-6">
            <Text className="text-sm font-semibold text-zinc-400 mb-3 uppercase">
              Detected Action
            </Text>
            <View className="mb-3">
              <Text className="text-xs text-zinc-500 mb-1">Type</Text>
              <Text className="text-lg font-bold text-zinc-50">
                {confirmed.action}
              </Text>
            </View>
            <View className="mb-3">
              <Text className="text-xs text-zinc-500 mb-1">Product</Text>
              <Text className="text-lg font-bold text-zinc-50">
                {confirmed.productName}
              </Text>
            </View>
            <View className="mb-3">
              <Text className="text-xs text-zinc-500 mb-1">Quantity</Text>
              <Text className="text-lg font-bold text-zinc-50">
                {confirmed.quantity}
              </Text>
            </View>
            {confirmed.price && (
              <View>
                <Text className="text-xs text-zinc-500 mb-1">Price</Text>
                <Text className="text-lg font-bold text-zinc-50">
                  ₦{confirmed.price.toLocaleString()}
                </Text>
              </View>
            )}
          </View>

          <View className="flex-row gap-4">
            <TouchableOpacity
              className="flex-1 items-center justify-center rounded-2xl py-4 bg-zinc-800"
              onPress={() => setConfirmed(null)}
            >
              <Text className="font-semibold text-zinc-400">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 items-center justify-center rounded-2xl py-4 bg-cyan-500"
              onPress={confirmAndSave}
              disabled={isProcessing}
            >
              <Text className="font-semibold text-white">
                {isProcessing ? 'Saving...' : 'Confirm & Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default VoiceLedger;

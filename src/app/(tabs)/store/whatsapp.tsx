import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { ChatMessage, Location } from '../../../types';
import whatsappService from '../../../lib/whatsapp';
import { useSubscription } from '../../../hooks/security';
import { usePermissions } from '../../../hooks/security';
import { supabase } from '../../../lib/supabase';
import type { Product, ActivityFeed } from '../../../types';

const uuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export default function WhatsAppScreen() {
  const { profile, isLoading: permissionsLoading } = usePermissions();
  const [activeBranch, setActiveBranch] = useState('all');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [activities, setActivities] = useState<ActivityFeed[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hasProAccess, isInTrial } = useSubscription();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [productsRes, activitiesRes, locationsRes] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('activities').select('*').order('timestamp', { ascending: false }),
        supabase.from('locations').select('*')
      ]);
      if (productsRes.error) throw productsRes.error;
      if (activitiesRes.error) throw activitiesRes.error;
      if (locationsRes.error) throw locationsRes.error;
      setProducts(productsRes.data || []);
      setActivities(activitiesRes.data || []);
      setLocations(locationsRes.data || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate dynamic messages based on real data
  const generateDynamicMessages = useCallback((productsList: Product[], activitiesList: ActivityFeed[]): ChatMessage[] => {
    const dynamicMessages: ChatMessage[] = [];

    // Find first low stock product
    const lowStockProduct = productsList.find(p => (p.stock_quantity || 0) < 10);
    if (lowStockProduct) {
      dynamicMessages.push({
        id: uuid(),
        sender_role: 'ai_manager',
        message_type: 'text',
        text: `Stock Alert: "${lowStockProduct.name}" is running low (only ${lowStockProduct.stock_quantity} left). I've drafted a restock request for you.`,
        timestamp: new Date().toISOString(),
        sender_name: 'shopX Business Agent',
      });
    }

    // Find recent credit activity
    const recentActivity = activitiesList[0];
    if (recentActivity) {
      if (recentActivity.type === 'sale' && recentActivity.total_amount) {
        dynamicMessages.push({
          id: uuid(),
          sender_role: 'ai_manager',
          message_type: 'text',
          text: `Sales Alert: A sale of ${recentActivity.total_amount ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(recentActivity.total_amount) : 'an amount'} was just logged.`,
          timestamp: new Date(Date.now() - 60000).toISOString(),
          sender_name: 'shopX Business Agent',
        });
      }
    }

    // Default fallback messages
    if (dynamicMessages.length === 0) {
      dynamicMessages.push({
        id: uuid(),
        sender_role: 'ai_manager',
        message_type: 'text',
        text: 'Welcome to shopX Business Agent! You can ask questions about your sales, inventory, or request reports.',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        sender_name: 'shopX Business Agent',
      });
    }

    return dynamicMessages;
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Prepare branches options
  const branches = [
    { id: 'all', name: 'All Branches' },
    ...locations.map(loc => ({
      id: loc.id,
      name: loc.name
    }))
  ];

  // Once data loads, set initial messages
  useEffect(() => {
    if (!isLoading && (products.length > 0 || activities.length > 0 || locations.length > 0)) {
      const initialMessages = generateDynamicMessages(products, activities);
      setMessages(initialMessages);
    }
  }, [isLoading, products, activities, generateDynamicMessages, locations]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
      id: uuid(),
      sender_role: 'owner',
      message_type: 'text',
      text: inputText,
      timestamp: new Date().toISOString(),
      sender_name: 'You (Owner)',
    };

    setMessages([...messages, newMessage]);
    setInputText('');
  };

  const handleBroadcastUpdate = () => {
    const broadcastMessage: ChatMessage = {
      id: uuid(),
      sender_role: 'ai_manager',
      message_type: 'text',
      text: 'BROADCAST: Price update effective immediately. Ankara fabric prices increased by 5%. Please update all tags.',
      timestamp: new Date().toISOString(),
      sender_name: 'shopX Business Agent',
    };

    setMessages([...messages, broadcastMessage]);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwner = item.sender_role === 'owner';
    const isAI = item.sender_role === 'ai_manager';

    return (
      <View className="flex-row px-4 py-2">
        <View
          className={`max-w-[80%] rounded-2xl p-4 ${isOwner ? 'bg-emerald-600' : isAI ? 'bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40' : 'bg-zinc-900'}`}
        >
          {/* AI Avatar/Header */}
          {isAI && (
            <View className="flex-row items-center gap-2 mb-2">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500">
                <Feather name="zap" size={14} color="#FFFFFF" />
              </View>
              <Text className="text-xs font-bold text-cyan-400">
                shopX Business Agent
              </Text>
            </View>
          )}

          {!isAI && !isOwner && (
            <Text className="text-xs font-semibold mb-1 text-zinc-400">
              {item.sender_name}
            </Text>
          )}

          {item.message_type === 'audio' && (
            <View className="flex-row items-center mb-2 gap-3 bg-zinc-800/50 rounded-xl p-3">
              <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full bg-zinc-700">
                <Feather name="play" size={18} color="#A1A1AA" />
              </TouchableOpacity>
              <View className="flex-1 h-1 bg-zinc-600 rounded-full overflow-hidden">
                <View className="h-full w-2/5 bg-zinc-400" />
              </View>
            </View>
          )}

          <Text className={`text-base leading-6 ${isOwner ? 'text-white' : 'text-zinc-50'}`}>
            {item.text}
          </Text>

          {item.transcription && (
            <View className="mt-3 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700">
              <Text className="text-xs font-semibold text-zinc-500 mb-1">
                AI Transcription
              </Text>
              <Text className="text-sm text-zinc-300">{item.transcription}</Text>
            </View>
          )}

          {isAI && !hasProAccess && (
            <Text className="text-xs mt-2 text-right text-zinc-500">
              Powered by shopX Basic
            </Text>
          )}
          
          {isAI && hasProAccess && (
            <Text className="text-xs mt-2 text-right text-cyan-400">
              Premium Analytics Enabled
            </Text>
          )}

          <Text className={`text-xs mt-1 text-right ${isOwner ? 'text-emerald-100' : 'text-zinc-500'}`}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading || permissionsLoading) {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-zinc-400 mt-4">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-zinc-950">
      {/* Status Header */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center mb-4 gap-2">
          <View className="h-3 w-3 rounded-full bg-[#25D366] animate-pulse" />
          <Text className="text-sm font-semibold text-[#25D366]">
            Business Agent Active
          </Text>
        </View>

        <FlatList
          data={branches}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 pb-2"
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              className={`px-4 py-2 rounded-full border ${activeBranch === item.id ? 'bg-[#25D366] border-[#25D366]' : 'bg-zinc-900 border-zinc-800'}`}
              onPress={() => setActiveBranch(item.id)}
            >
              <Text className={`text-sm font-medium ${activeBranch === item.id ? 'text-white' : 'text-zinc-400'}`}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Chat List */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerClassName="py-4"
        showsVerticalScrollIndicator={false}
        inverted
      />

      {/* Command Dock */}
      <View className="bg-zinc-950 border-t border-zinc-800 p-4">
        <View className="flex-row gap-2 items-end">
          <TouchableOpacity
            className="h-10 w-10 items-center justify-center rounded-full bg-zinc-800"
            onPress={handleBroadcastUpdate}
          >
            <Feather name="send" size={18} color="#A1A1AA" />
          </TouchableOpacity>
          <View className="flex-1 bg-zinc-900 rounded-2xl flex-row items-end px-4 py-2">
            <TextInput
              className="flex-1 text-white placeholder-zinc-500"
              placeholder="Type a message..."
              placeholderTextColor="#71717A"
              value={inputText}
              onChangeText={setInputText}
              multiline
              style={{ textAlignVertical: 'center' }}
            />
          </View>
          <TouchableOpacity
            className={`h-10 w-10 items-center justify-center rounded-full ${inputText.trim() ? 'bg-[#25D366]' : 'bg-zinc-800'}`}
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
          >
            <Feather
              name="paperclip"
              size={18}
              color={inputText.trim() ? '#FFFFFF' : '#A1A1AA'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

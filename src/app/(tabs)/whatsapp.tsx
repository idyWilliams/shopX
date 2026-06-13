import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { ChatMessage } from '../../types';
import whatsappService from '../../lib/whatsapp';
import { useSubscription } from '../../hooks/security';

const uuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const BRANCHES = [
  { id: 'all', name: 'All Branches' },
  { id: 'ikeja', name: 'Ikeja Branch Staff' },
  { id: 'lekki', name: 'Lekki Management' },
  { id: 'vi', name: 'Victoria Island' },
];

const initialMockMessages: ChatMessage[] = [
  {
    id: uuid(),
    sender_role: 'staff',
    message_type: 'audio',
    text: 'Voice Note (0:23)',
    transcription: 'Translated from Audio: "Madam Grace carried 2 bags of Dangote, she said she will pay balance tomorrow"',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    sender_name: 'Chidi (Ikeja)',
  },
  {
    id: uuid(),
    sender_role: 'ai_manager',
    message_type: 'text',
    text: '✅ Logged! Debt (Accounts Receivable) updated for Madam Grace: ₦17,000. Current stock: 46 bags.',
    timestamp: new Date(Date.now() - 1740000).toISOString(),
    sender_name: 'shopX AI Manager',
  },
];

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export default function WhatsAppScreen() {
  const [activeBranch, setActiveBranch] = useState('all');
  const [messages, setMessages] = useState<ChatMessage[]>(initialMockMessages);
  const [inputText, setInputText] = useState('');
  const { hasProAccess, isInTrial } = useSubscription();

  // Proactive Business Agent alerts - simulate on mount
  useEffect(() => {
    const sendProactiveAlerts = () => {
      const alerts: ChatMessage[] = [
        {
          id: uuid(),
          sender_role: 'ai_manager',
          message_type: 'text',
          text: '⚠️ Stock Alert: "Designer Heels - Red" at Victoria Island is running low (only 3 left). I\'ve drafted a restock request for you.',
          timestamp: new Date().toISOString(),
          sender_name: 'shopX Business Agent',
        },
        {
          id: uuid(),
          sender_role: 'ai_manager',
          message_type: 'text',
          text: '📊 Performance Alert: Today\'s sales are 25% below your 7-day average. Consider running a small promotion.',
          timestamp: new Date(Date.now() - 60000).toISOString(),
          sender_name: 'shopX Business Agent',
        },
        {
          id: uuid(),
          sender_role: 'ai_manager',
          message_type: 'text',
          text: '💸 Credit Alert: A large credit (₦50,000) was just logged for "Mr. Emeka". Keep an eye on this payment.',
          timestamp: new Date(Date.now() - 120000).toISOString(),
          sender_name: 'shopX Business Agent',
        }
      ];
      setMessages(prev => [...prev, ...alerts]);
    };

    // Only send proactive alerts if Pro or in trial
    if (hasProAccess) {
      sendProactiveAlerts();
    }
  }, [hasProAccess]);

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
      text: '📢 BROADCAST: Price update effective immediately. Ankara fabric prices increased by 5%. Please update all tags.',
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
                🎤 AI Transcription
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
          data={BRANCHES}
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

import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';

const iconMap = {
  index: 'home',
  inventory: 'package',
  leads: 'trending-up',
  alerts: 'activity',
  whatsapp: 'message-circle',
  settings: 'settings',
} as const;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#1F2937',
          borderTopColor: '#374151',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#0EA5E9',
        tabBarInactiveTintColor: '#9CA3AF',
        headerStyle: {
          backgroundColor: '#1F2937',
        },
        headerTintColor: '#F9FAFB',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => <Feather name={iconMap.index} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color, size }) => <Feather name={iconMap.inventory} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          title: 'Leads',
          tabBarIcon: ({ color, size }) => <Feather name={iconMap.leads} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }) => <Feather name={iconMap.alerts} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="whatsapp"
        options={{
          title: 'WhatsApp',
          tabBarActiveTintColor: '#25D366',
          tabBarIcon: ({ color, size }) => <Feather name={iconMap.whatsapp} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Feather name={iconMap.settings} color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import AnimatedTabBar from '../../components/ui/AnimatedTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Register',
          tabBarIcon: ({ color }) => <Feather name="shopping-cart" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="register"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          tabBarLabel: 'Inventory',
          tabBarIcon: ({ color }) => <Feather name="package" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          tabBarLabel: 'Store',
          tabBarIcon: ({ color }) => <Feather name="grid" size={22} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => <Feather name="settings" size={22} color={color} />,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

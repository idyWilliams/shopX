import { Stack } from 'expo-router';

const screenOptions = {
  headerStyle: { backgroundColor: '#09090b' },
  headerTintColor: '#f4f4f5',
  headerTitleStyle: { fontWeight: '600' as const, fontSize: 17 },
  headerShadowVisible: false,
};

export default function StoreLayout() {
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ title: 'Store' }} />
      <Stack.Screen name="leads" options={{ title: 'Leads' }} />
      <Stack.Screen name="whatsapp" options={{ title: 'WhatsApp Agent' }} />
      <Stack.Screen name="referral" options={{ title: 'Referral' }} />
      <Stack.Screen name="upgrade" options={{ title: 'Upgrade' }} />
    </Stack>
  );
}

import 'react-native-url-polyfill/auto';

export const validateApiKeys = () => {
  const requiredKeys = [
    { name: 'OPENAI_API_KEY', value: process.env.EXPO_PUBLIC_OPENAI_API_KEY },
    { name: 'FIRECRAWL_API_KEY', value: process.env.EXPO_PUBLIC_FIRECRAWL_API_KEY },
    { name: 'SUPABASE_URL', value: process.env.EXPO_PUBLIC_SUPABASE_URL },
    { name: 'SUPABASE_ANON_KEY', value: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY }
  ];

  const missing = requiredKeys.filter(key => !key.value);

  if (missing.length > 0) {
    const errorMsg = `Missing required API keys: ${missing.map(k => k.name).join(', ')}`;
    console.error(errorMsg);
    // Don't throw, just log, to allow app to start
  }

  return {
    openAiApiKey: requiredKeys[0].value as string,
    firecrawlApiKey: requiredKeys[1].value as string
  };
};

// Run validation immediately on import
try {
  validateApiKeys();
} catch (error) {
  console.error('API key validation failed:', error);
}
import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './src/app/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
        },
        sale: '#10B981',
        restock: '#3B82F6',
        transfer: '#8B5CF6',
        anomaly: '#F59E0B',
      },
    },
  },
  plugins: [],
} satisfies Config;

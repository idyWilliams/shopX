# ShopX WatermelonDB Setup Instructions

## Step 1: Install Required Dependencies

First, install the WatermelonDB packages:

```bash
npm install @nozbe/watermelondb @nozbe/with-observables
npm install --save-dev @babel/plugin-proposal-decorators @babel/plugin-proposal-class-properties
```

## Step 2: Configure Babel

Update your `babel.config.js` file:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "@babel/plugin-proposal-class-properties",
      [
        "@babel/plugin-proposal-decorators",
        {
          legacy: true,
        },
      ],
      "nativewind/babel",
      "react-native-reanimated/plugin",
    ],
  };
};
```

## Step 3: Configure TypeScript

Update your `tsconfig.json` to enable decorator support:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["ES2017"],
    "allowJs": true,
    "jsx": "react-native",
    "noEmit": true,
    "strict": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "isolatedModules": true
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts"
  ],
  "exclude": ["node_modules"]
}
```

## Step 4: Configure Metro

Create or update your `metro.config.js` file:

```javascript
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push("cjs");

module.exports = config;
```

## Step 5: Prebuild for Native (for iOS/Android)

Since WatermelonDB requires native dependencies, you'll need to prebuild your Expo project:

```bash
npx expo prebuild
```

## Step 6: Update Expo Router Layout

Wrap your app with a WatermelonDB provider (if needed). For example, in your root `_layout.tsx`:

```tsx
import { DatabaseProvider } from '@nozbe/watermelondb/react';
import { database } from '../db';

// ... existing code ...

<AuthProvider>
  <DatabaseProvider database={database}>
    <RootLayoutNav />
  </DatabaseProvider>
</AuthProvider>
```

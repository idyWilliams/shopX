// Polyfill `document` for Expo HMR in React Native / Hermes
// expo/src/async-require/hmr.ts references `document?.currentScript`
// which throws a ReferenceError in Hermes (not just undefined).
if (typeof document === 'undefined') {
  global.document = undefined;
}

// Bootstrap expo-router
require('expo-router/entry');

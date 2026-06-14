// Jest setup file
import '@testing-library/react-native/extend-expect';

// Mock react-native components that might cause issues
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});
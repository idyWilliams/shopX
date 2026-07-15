export * from '@use-africa-pay/react-native';

export const generatePaymentReference = () => {
  return `SHOPX_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

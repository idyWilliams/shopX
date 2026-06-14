type PaymentType = 'card' | 'ussd' | 'bank_transfer';

type TransactionParams = {
  amount: number;
  currency: string;
  type: PaymentType;
  reference?: string;
};

type TransactionResult = {
  success: boolean;
  provider: string;
  reference: string;
  message: string;
};

const simulateProviderA = async (params: TransactionParams): Promise<TransactionResult> => {
  // Simulate Paystack (Provider A)
  const successRate = 0.7; // 70% success rate
  if (Math.random() > successRate) {
    throw new Error('Network timeout - Provider A unavailable');
  }

  return {
    success: true,
    provider: 'Provider A',
    reference: `PA-${Date.now()}`,
    message: 'Transaction successful via Provider A',
  };
};

const simulateProviderB = async (params: TransactionParams): Promise<TransactionResult> => {
  // Simulate Flutterwave (Provider B)
  return {
    success: true,
    provider: 'Provider B',
    reference: `PB-${Date.now()}`,
    message: 'Transaction successful via Provider B',
  };
};

export const initiateTransaction = async (params: TransactionParams): Promise<TransactionResult> => {
  try {
    const result = await simulateProviderA(params);
    return result;
  } catch (error) {
    console.warn('Provider A failed, falling back to Provider B', error);
    const fallbackResult = await simulateProviderB(params);
    return fallbackResult;
  }
};
import { CONSULTATION_FEE } from '../config/constants';

const IS_MOCK_PAYMENT = process.env.NEXT_PUBLIC_USE_MOCK_PAYMENT === 'true';

export async function initiatePayment(phoneNumber: string) {
  try {
    const endpoint = IS_MOCK_PAYMENT 
      ? '/api/mock-payment'
      : '/api/mpesa/stk-push';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber,
        amount: CONSULTATION_FEE
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('Payment initiation failed:', error);
    throw error;
  }
} 
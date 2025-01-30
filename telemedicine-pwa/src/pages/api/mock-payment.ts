import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../config/firebase';
import { addDoc, collection } from 'firebase/firestore';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phoneNumber, amount } = req.body;

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create mock payment record
    const paymentRef = collection(db, 'payments');
    const payment = await addDoc(paymentRef, {
      amount,
      status: 'completed',
      phoneNumber,
      transactionId: `TEST-${Date.now()}`,
      createdAt: new Date()
    });

    // Log instead of sending real SMS for now
    console.log(`[MOCK SMS] To: ${phoneNumber}, Message: Test Payment Received: KES ${amount} for consultation. TransactionID: ${payment.id}`);

    res.status(200).json({ 
      success: true, 
      paymentId: payment.id 
    });
  } catch (error) {
    console.error('Mock payment error:', error);
    res.status(500).json({ error: 'Payment simulation failed' });
  }
} 
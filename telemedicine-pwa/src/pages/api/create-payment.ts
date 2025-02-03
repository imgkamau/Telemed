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
    const { amount, doctorId, userId, consultationData } = req.body;

    if (!db) throw new Error('Database not initialized');
    const paymentRef = collection(db, 'payments');
    const payment = await addDoc(paymentRef, {
      amount,
      status: 'pending',
      doctorId,
      userId,
      createdAt: new Date(),
      // Add M-Pesa specific fields here
      phoneNumber: req.body.phoneNumber,
      transactionId: `TRX-${Date.now()}`,
    });

    // Here you would integrate with M-Pesa API
    // For now, we'll simulate a successful payment

    res.status(200).json({ 
      paymentId: payment.id,
      message: 'Payment initiated',
      // Add M-Pesa response data here
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Payment initiation failed' });
  }
} 
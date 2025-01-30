import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../config/firebase';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { Body } = req.body;
    const { stkCallback } = Body;
    
    // Handle successful payment
    if (stkCallback.ResultCode === 0) {
      // Update payment status
      const paymentRef = doc(db, 'payments', stkCallback.CheckoutRequestID);
      await updateDoc(paymentRef, {
        status: 'completed',
        transactionId: stkCallback.MpesaReceiptNumber
      });

      // Create consultation session
      const consultationRef = collection(db, 'consultations');
      await addDoc(consultationRef, {
        paymentId: stkCallback.CheckoutRequestID,
        status: 'pending',
        createdAt: new Date(),
        // Add WebRTC session details here
        roomId: `room-${Date.now()}`,
        // Other consultation details will be added when doctor joins
      });
    }

    res.status(200).json({ message: 'Callback processed' });
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({ error: 'Callback processing failed' });
  }
} 
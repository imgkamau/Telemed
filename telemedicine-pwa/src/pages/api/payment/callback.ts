import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { sendSMS } from '../../../utils/notifications';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { Body: { stkCallback: { CheckoutRequestID, ResultCode, ResultDesc } } } = req.body;

    const paymentRef = doc(db, 'payments', CheckoutRequestID);
    const paymentDoc = await getDoc(paymentRef);

    if (!paymentDoc.exists()) {
      throw new Error('Payment record not found');
    }

    const paymentData = paymentDoc.data();

    await updateDoc(paymentRef, {
      status: ResultCode === 0 ? 'completed' : 'failed',
      resultDescription: ResultDesc,
      updatedAt: new Date().toISOString()
    });

    // If payment successful, send SMS
    if (ResultCode === 0) {
      await sendSMS(
        paymentData.phoneNumber,
        'Payment received. You will be connected to a doctor shortly.'
      );
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Payment callback error:', error);
    res.status(500).json({ success: false });
  }
} 
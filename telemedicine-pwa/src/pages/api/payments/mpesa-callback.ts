import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { sendSMS } from '../../../utils/notifications';

interface MPesaCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value?: number | string;
        }>;
      };
    };
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const callback = req.body as MPesaCallback;
    const { 
      CheckoutRequestID, 
      ResultCode, 
      ResultDesc, 
      CallbackMetadata 
    } = callback.Body.stkCallback;

    // Get payment record
    const paymentRef = doc(db, 'payments', CheckoutRequestID);
    const paymentDoc = await getDoc(paymentRef);

    if (!paymentDoc.exists()) {
      throw new Error('Payment record not found');
    }

    const paymentData = paymentDoc.data();
    let transactionId = '';
    let transactionDate = '';

    // Extract transaction details if payment successful
    if (ResultCode === 0 && CallbackMetadata) {
      CallbackMetadata.Item.forEach(item => {
        if (item.Name === 'MpesaReceiptNumber') {
          transactionId = item.Value as string;
        }
        if (item.Name === 'TransactionDate') {
          transactionDate = item.Value as string;
        }
      });
    }

    // Update payment record
    await updateDoc(paymentRef, {
      status: ResultCode === 0 ? 'completed' : 'failed',
      resultDescription: ResultDesc,
      transactionId,
      transactionDate,
      updatedAt: new Date().toISOString()
    });

    // Send SMS notification
    if (ResultCode === 0) {
      await sendSMS(
        paymentData.phoneNumber,
        `Payment of KES ${paymentData.amount} received. Transaction ID: ${transactionId}. You will be connected to a doctor shortly.`
      );

      // Update consultation status
      const consultationRef = doc(db, 'consultations', paymentData.consultationId);
      await updateDoc(consultationRef, {
        status: 'paid',
        paymentId: CheckoutRequestID,
        updatedAt: new Date().toISOString()
      });
    } else {
      await sendSMS(
        paymentData.phoneNumber,
        `Payment failed: ${ResultDesc}. Please try again or contact support.`
      );
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Payment callback error:', error);
    res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : 'Callback processing failed'
    });
  }
} 
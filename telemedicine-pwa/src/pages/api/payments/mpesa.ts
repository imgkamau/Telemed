import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';

const MPESA_CONSUMER_KEY = process.env.NEXT_PUBLIC_MPESA_CONSUMER_KEY!;
const MPESA_CONSUMER_SECRET = process.env.NEXT_PUBLIC_MPESA_CONSUMER_SECRET!;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY!;
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE!;
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL!;

// Check if mock payment is enabled
const useMockPayment = process.env.NEXT_PUBLIC_USE_MOCK_PAYMENT === 'true';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { phoneNumber, amount, consultationId } = req.body;

    // Format phone number
    const formattedPhone = phoneNumber.replace('+', '')
      .replace(/^0/, '254')
      .replace(/^254254/, '254');

    // Get OAuth token
    const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
    const tokenResponse = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: { Authorization: `Basic ${auth}` }
      }
    );

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(
      `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    // Log the payment attempt
    console.log('Payment attempt:', {
      useMockPayment,
      phoneNumber,
      amount,
      MPESA_CONSUMER_KEY: process.env.NEXT_PUBLIC_MPESA_CONSUMER_KEY?.slice(0, 5) + '...',
      MPESA_PASSKEY: process.env.MPESA_PASSKEY?.slice(0, 5) + '...',
    });

    // Initiate STK Push
    const stkResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: MPESA_SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: MPESA_CALLBACK_URL,
        AccountReference: consultationId,
        TransactionDesc: 'Doctor Consultation'
      },
      {
        headers: {
          Authorization: `Bearer ${tokenResponse.data.access_token}`
        }
      }
    );

    // Create payment record
    const payment = {
      id: stkResponse.data.CheckoutRequestID,
      consultationId,
      amount,
      phoneNumber: formattedPhone,
      status: 'pending',
      createdAt: new Date().toISOString(),
      checkoutRequestId: stkResponse.data.CheckoutRequestID,
      merchantRequestId: stkResponse.data.MerchantRequestID
    };

    // Store in Firestore
    await setDoc(doc(db, 'payments', payment.id), payment);

    res.status(200).json({
      success: true,
      payment
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to initiate payment' 
    });
  }
} 
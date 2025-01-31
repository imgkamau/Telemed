import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';

const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY!;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET!;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY!;
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE!;
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL!;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { phoneNumber, amount, userId } = req.body;

    // Format phone number (remove +254 if present and add 254)
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
        AccountReference: 'Telemedicine',
        TransactionDesc: 'Doctor Consultation'
      },
      {
        headers: {
          Authorization: `Bearer ${tokenResponse.data.access_token}`
        }
      }
    );

    // Store payment request in Firestore
    const paymentRef = doc(db, 'payments', stkResponse.data.CheckoutRequestID);
    await setDoc(paymentRef, {
      userId,
      amount,
      phoneNumber: formattedPhone,
      status: 'pending',
      createdAt: new Date().toISOString(),
      checkoutRequestId: stkResponse.data.CheckoutRequestID,
      merchantRequestId: stkResponse.data.MerchantRequestID
    });

    res.status(200).json({
      success: true,
      checkoutRequestId: stkResponse.data.CheckoutRequestID
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to initiate payment' 
    });
  }
} 
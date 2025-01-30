import type { NextApiRequest, NextApiResponse } from 'next';
import AfricasTalking from 'africastalking';

// Initialize Africa's Talking
const africastalking = AfricasTalking({
  apiKey: process.env.AT_API_KEY!,
  username: process.env.AT_USERNAME!,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phoneNumber, message } = req.body;

    // Send SMS
    const result = await africastalking.SMS.send({
      to: phoneNumber,
      message,
      from: process.env.AT_SENDER_ID // Your registered sender ID
    });

    res.status(200).json({ 
      message: 'SMS sent successfully',
      result 
    });
  } catch (error) {
    console.error('SMS error:', error);
    res.status(500).json({ error: 'Failed to send SMS' });
  }
} 
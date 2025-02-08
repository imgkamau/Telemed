import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import axios from 'axios';

const AFRICA_TALKING_API_KEY = process.env.AFRICA_TALKING_API_KEY!;
const AFRICA_TALKING_USERNAME = process.env.AFRICA_TALKING_USERNAME!;

export async function sendNotification(userId: string, message: string, type: 'consultation' | 'prescription') {
  try {
    if (!db) throw new Error('Database not initialized');
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      userId,
      message,
      type,
      read: false,
      createdAt: serverTimestamp(),
    });

    // If PWA is installed, send push notification
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      // Send push notification
      // You'll need to set up a service worker and push notifications
    }

    // Send SMS (you can integrate with Africa's Talking or similar)
    await fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phoneNumber: userId, 
        message 
      })
    });

  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

export async function sendSMS(phoneNumber: string, message: string) {
  try {
    await axios.post(
      'https://api.africastalking.com/version1/messaging',
      {
        username: AFRICA_TALKING_USERNAME,
        to: phoneNumber,
        message
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'apiKey': AFRICA_TALKING_API_KEY
        }
      }
    );
    return true;
  } catch (error) {
    console.error('SMS sending error:', error);
    return false;
  }
} 
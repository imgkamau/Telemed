import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function sendNotification(userId: string, message: string, type: 'consultation' | 'prescription') {
  try {
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
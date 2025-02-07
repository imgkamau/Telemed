import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../config/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, DocumentReference } from 'firebase/firestore';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!db) throw new Error('Database not initialized');
    const { doctorId, assessment, patientId } = req.body;

    const consultationRef = collection(db, 'consultations');
    const consultation = await addDoc(consultationRef, {
      doctorId,
      patientId,
      assessment,
      status: 'pending',
      createdAt: serverTimestamp(),
      messages: [],
      prescription: null
    }) as DocumentReference;

    // Now update with roomId
    await updateDoc(consultation, {
      roomId: consultation.id
    });

    // Send notification to doctor
    await fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: process.env.DOCTOR_PHONE, // You'll need to get this from doctor's data
        message: `New consultation request. Please log in to the system.`
      })
    });

    res.status(200).json({ 
      consultationId: consultation.id,
      message: 'Consultation created successfully' 
    });
  } catch (error) {
    console.error('Create consultation error:', error);
    res.status(500).json({ error: 'Failed to create consultation' });
  }
} 
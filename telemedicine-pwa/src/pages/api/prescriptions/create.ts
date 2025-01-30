import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { sendNotification } from '../../../utils/notifications';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, consultationId, medications, instructions } = req.body;

    // Create prescription
    const prescriptionsRef = collection(db, 'prescriptions');
    const prescription = await addDoc(prescriptionsRef, {
      userId,
      consultationId,
      medications,
      instructions,
      createdAt: new Date(),
      status: 'active'
    });

    // Send notification to user
    await sendNotification(
      userId,
      'New prescription available from your doctor',
      'prescription'
    );

    res.status(200).json({ 
      message: 'Prescription created',
      prescriptionId: prescription.id 
    });
  } catch (error) {
    console.error('Prescription error:', error);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
} 
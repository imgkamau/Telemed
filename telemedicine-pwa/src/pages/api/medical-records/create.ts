import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { sendSMS } from '@/src/utils/notifications';

interface MedicalRecord {
  patientId: string;
  doctorId: string;
  consultationId: string;
  diagnosis: string;
  prescription?: string;
  notes: string;
  followUp?: string;
  createdAt: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const record: MedicalRecord = {
      ...req.body,
      createdAt: new Date().toISOString()
    };

    // Create medical record
    const recordRef = doc(db, 'medicalRecords', record.consultationId);
    await setDoc(recordRef, record);

    // Send SMS notification to patient
    await sendSMS(
      req.body.patientPhone,
      'Your consultation record has been created. You can view it in your medical history.'
    );

    res.status(200).json({ success: true, recordId: record.consultationId });
  } catch (error) {
    console.error('Medical record creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to create medical record' 
    });
  }
} 
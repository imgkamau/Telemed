import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../config/firebase';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { sendNotification } from '../../../utils/notifications';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'POST':
      return createPrescription(req, res);
    case 'PUT':
      return updatePrescription(req, res);
    default:
      res.setHeader('Allow', ['POST', 'PUT']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function createPrescription(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { consultationId, medications, instructions, followUp, patientId, doctorId } = req.body;
    
    const prescriptionRef = collection(db, 'prescriptions');
    const prescription = await addDoc(prescriptionRef, {
      consultationId,
      medications,
      instructions,
      followUp,
      patientId,
      doctorId,
      createdAt: new Date(),
      status: 'active'
    });

    // Send notification to patient
    const patientDoc = await getDoc(doc(db, 'users', patientId));
    const patientPhone = patientDoc.data()?.phoneNumber;

    if (patientPhone) {
      await sendNotification(
        patientPhone,
        'Your prescription is ready. Please check your account for details.',
        'prescription'
      );
    }

    res.status(200).json({ 
      prescriptionId: prescription.id,
      message: 'Prescription created successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create prescription' });
  }
}

async function updatePrescription(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { prescriptionId, status, followUp } = req.body;
    const prescriptionRef = doc(db, 'prescriptions', prescriptionId);
    await updateDoc(prescriptionRef, { status, followUp });
    res.status(200).json({ message: 'Prescription updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update prescription' });
  }
} 
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../config/firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { sendNotification } from '../../../utils/notifications';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { 
      patientId, 
      doctorId, 
      prescriptionId,
      scheduledDate,
      notes 
    } = req.body;

    if (!db) throw new Error('Database not initialized');
    // Check doctor availability
    const availabilityRef = doc(db, 'doctorAvailability', doctorId);
    const availabilityDoc = await getDoc(availabilityRef);
    const availability = availabilityDoc.data();


    // Validate selected date against availability
    if (!isDateAvailable(scheduledDate, availability)) {
      return res.status(400).json({ error: 'Selected date is not available' });
    }

    // Create follow-up appointment
    const followUpRef = collection(db, 'followUps');
    const followUp = await addDoc(followUpRef, {
      patientId,
      doctorId,
      prescriptionId,
      scheduledDate,
      notes,
      status: 'scheduled',
      createdAt: new Date()
    });

    // Update doctor's availability
    await updateDoctorAvailability(doctorId, scheduledDate);

    // Send notifications
    const [patientDoc, doctorDoc] = await Promise.all([
      getDoc(doc(db, 'users', patientId)),
      getDoc(doc(db, 'users', doctorId))
    ]);

    const patientPhone = patientDoc.data()?.phoneNumber;
    const doctorPhone = doctorDoc.data()?.phoneNumber;

    if (patientPhone) {
      await sendNotification(
        patientPhone,
        `Your follow-up appointment is scheduled for ${scheduledDate}`,
        'consultation'
      );
    }

    if (doctorPhone) {
      await sendNotification(
        doctorPhone,
        `New follow-up appointment scheduled for ${scheduledDate}`,
        'consultation'
      );
    }

    res.status(200).json({ 
      followUpId: followUp.id,
      message: 'Follow-up scheduled successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to schedule follow-up' });
  }
}

function isDateAvailable(date: string, availability: any): boolean {
  // Implement availability checking logic
  return true; // Placeholder
}

async function updateDoctorAvailability(doctorId: string, date: string) {
  // Implement availability update logic
  // This should add the booked slot to the doctor's availability
} 
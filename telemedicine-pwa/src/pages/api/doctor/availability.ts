import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../config/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'GET':
      return getDoctorAvailability(req, res);
    case 'POST':
      return updateDoctorAvailability(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function getDoctorAvailability(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { doctorId } = req.query;
    const availabilityRef = doc(db, 'doctorAvailability', doctorId as string);
    const availabilityDoc = await getDoc(availabilityRef);

    if (!availabilityDoc.exists()) {
      return res.status(404).json({ error: 'Availability not found' });
    }

    res.status(200).json(availabilityDoc.data());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
}

async function updateDoctorAvailability(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { doctorId, availability } = req.body;
    const availabilityRef = doc(db, 'doctorAvailability', doctorId);
    await setDoc(availabilityRef, availability, { merge: true });
    res.status(200).json({ message: 'Availability updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update availability' });
  }
} 
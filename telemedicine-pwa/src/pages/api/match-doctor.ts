import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Doctor } from '../../types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { consultationId, specialty, symptoms } = req.body;

    // Query doctors based on specialty and availability
    const doctorsRef = collection(db, 'doctors');
    const q = query(
      doctorsRef,
      where('specialization', '==', specialty),
      where('availability', '==', true)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return res.status(404).json({ 
        matchedDoctors: [],
        message: 'No available doctors found for this specialty' 
      });
    }

    // Get all matching doctors
    const matchedDoctors = querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      specialization: doc.data().specialization,
      rating: doc.data().rating
    }));

    // Sort by rating
    const sortedDoctors = matchedDoctors.sort((a, b) => b.rating - a.rating);

    // Return top 3 matching doctors
    return res.status(200).json({ 
      matchedDoctors: sortedDoctors.slice(0, 3),
      estimatedWaitTime: '5-10 minutes'
    });

  } catch (error) {
    console.error('Doctor matching error:', error);
    res.status(500).json({ error: 'Failed to match doctor' });
  }
} 
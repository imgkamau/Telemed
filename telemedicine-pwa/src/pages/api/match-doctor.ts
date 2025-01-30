import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Assessment, Doctor } from '../../types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { assessment } = req.body as { assessment: Assessment };

    // MOCK DATA FOR TESTING
    const mockDoctor = {
      id: 'doctor123',
      name: 'Dr. John Doe',
      specialization: assessment?.specialty || 'General Practice',
      rating: 4.8
    };

    // Return mock response
    return res.status(200).json({ 
      doctorId: mockDoctor.id,
      doctorName: mockDoctor.name,
      estimatedWaitTime: '5-10 minutes'
    });

    /* PRODUCTION CODE (Commented for testing)
    // Query doctors based on specialty and availability
    const doctorsRef = collection(db, 'doctors');
    const q = query(
      doctorsRef,
      where('specialization', '==', assessment.specialty),
      where('availability', '==', true)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return res.status(404).json({ 
        error: 'No available doctors found for this specialty' 
      });
    }

    // Select the most suitable doctor based on urgency and rating
    const doctors = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Doctor[];

    // Simple matching logic - can be enhanced
    const matchedDoctor = doctors.sort((a, b) => b.rating - a.rating)[0];

    res.status(200).json({ 
      doctorId: matchedDoctor.id,
      doctorName: matchedDoctor.name,
      estimatedWaitTime: '5-10 minutes'
    });
    */
  } catch (error) {
    console.error('Doctor matching error:', error);
    res.status(500).json({ error: 'Failed to match doctor' });
  }
} 
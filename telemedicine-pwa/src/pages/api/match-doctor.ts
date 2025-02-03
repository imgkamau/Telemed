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
    // For testing, return mock data first
    return res.status(200).json({ 
      matchedDoctors: [{
        id: 'test-doctor',
        name: 'Dr. Test',
        specialization: req.body.specialty,
        rating: 4.8
      }]
    });

    /* Real implementation after testing
    const { specialty, symptoms } = req.body;
    console.log('Request body:', req.body); // Log entire request body

    if (!specialty) {
      return res.status(400).json({ 
        error: 'Missing specialty',
        receivedData: req.body 
      });
    }

    // Query doctors based on specialty and availability
    const doctorsRef = collection(db, 'doctors');
    console.log('Querying for specialty:', specialty);

    const q = query(
      doctorsRef,
      where('specialization', '==', specialty),
      where('availability', '==', true)
    );

    const querySnapshot = await getDocs(q);
    console.log('Query result size:', querySnapshot.size);

    if (querySnapshot.empty) {
      return res.status(200).json({ 
        matchedDoctors: [],
        message: 'No available doctors found for this specialty' 
      });
    }

    const matchedDoctors = querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      specialization: doc.data().specialization,
      rating: doc.data().rating
    }));

    console.log('Matched doctors:', matchedDoctors);

    return res.status(200).json({ 
      matchedDoctors,
      estimatedWaitTime: '5-10 minutes'
    });
    */
  } catch (error) {
    console.error('Doctor matching error:', error);
    return res.status(500).json({ 
      error: 'Failed to match doctor'
    });
  }
} 
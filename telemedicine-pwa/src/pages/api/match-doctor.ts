import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import type { Doctor } from '@/types';

interface MatchDoctorRequest {
  specialty: string;
  symptoms: string[];
  patientLocation?: string;
}

interface MatchDoctorResponse {
  matchedDoctors: Doctor[];
  availabilityInfo: {
    doctorLoads: { [key: string]: number };
    estimatedWaitTime: string;
    timestamp: string;
  };
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MatchDoctorResponse | { error: string; details?: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!db) {
      console.error('Firestore connection failed');
      return res.status(500).json({ 
        error: 'Database connection error',
        details: 'Failed to connect to Firestore'
      });
    }

    const { specialty, symptoms } = req.body as MatchDoctorRequest;
    console.log('Processing match request:', { specialty, symptoms });

    if (!specialty) {
      return res.status(400).json({ 
        error: 'Missing specialty',
        details: 'Specialty is required'
      });
    }

    const doctorsRef = collection(db, 'doctors');
    const primaryQuery = query(
      doctorsRef,
      where('specialization', '==', specialty),
      where('isAvailable', '==', true),
      where('isActive', '==', true),
      orderBy('rating', 'desc'),
      limit(5)
    );

    console.log('Executing primary query...');
    const querySnapshot = await getDocs(primaryQuery);
    console.log('Query results:', {
      size: querySnapshot.size,
      empty: querySnapshot.empty,
      docs: querySnapshot.docs.map(d => d.id)
    });

    if (querySnapshot.empty) {
      console.log('No exact specialty match, trying fallback...');
      
      const fallbackQuery = query(
        doctorsRef,
        where('canHandleGeneral', '==', true),
        where('isAvailable', '==', true),
        where('isActive', '==', true),
        orderBy('rating', 'desc'),
        limit(3)
      );

      const fallbackSnapshot = await getDocs(fallbackQuery);
      
      if (fallbackSnapshot.empty) {
        return res.status(200).json({ 
          matchedDoctors: [],
          availabilityInfo: {
            doctorLoads: {},
            estimatedWaitTime: '15-20 minutes',
            timestamp: new Date().toISOString()
          },
          message: 'No available doctors found at this time'
        });
      }

      const fallbackDoctors = fallbackSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        specialization: doc.data().specialization,
        rating: doc.data().rating,
        experience: doc.data().experience,
        availability: true,
        imageUrl: doc.data().imageUrl || '',
        consultationFee: doc.data().consultationFee
      }));

      return res.status(200).json({ 
        matchedDoctors: fallbackDoctors,
        availabilityInfo: {
          doctorLoads: {},
          estimatedWaitTime: '5-10 minutes',
          timestamp: new Date().toISOString()
        },
        message: 'Matched with available general practitioners'
      });
    }

    const matchedDoctors = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        specialization: data.specialization,
        rating: data.rating,
        experience: data.experience,
        availability: true,
        imageUrl: data.imageUrl || '',
        consultationFee: data.consultationFee
      };
    });

    const availabilityInfo = await calculateRealTimeAvailability(matchedDoctors);

    return res.status(200).json({ 
      matchedDoctors,
      availabilityInfo,
      message: 'Successfully matched with specialists'
    });

  } catch (error) {
    console.error('Doctor matching error:', error);
    return res.status(500).json({ 
      error: 'Failed to match doctor',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

async function calculateRealTimeAvailability(doctors: Doctor[]) {
  try {
    const consultationsRef = collection(db, 'consultations');
    const activeConsultations = query(
      consultationsRef,
      where('doctorId', 'in', doctors.map(d => d.id)),
      where('status', 'in', ['active', 'waiting'])
    );

    const consultationsSnapshot = await getDocs(activeConsultations);
    
    const doctorLoads: { [key: string]: number } = {};
    consultationsSnapshot.forEach(doc => {
      const consultation = doc.data();
      if (!doctorLoads[consultation.doctorId]) {
        doctorLoads[consultation.doctorId] = 0;
      }
      doctorLoads[consultation.doctorId]++;
    });

    return {
      doctorLoads,
      estimatedWaitTime: calculateWaitTime(doctorLoads),
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error calculating availability:', error);
    return {
      doctorLoads: {},
      estimatedWaitTime: '5-10 minutes',
      timestamp: new Date().toISOString()
    };
  }
}

function calculateWaitTime(doctorLoads: { [key: string]: number }) {
  const averageLoad = Object.values(doctorLoads).reduce((sum, load) => sum + load, 0) / 
                     Object.keys(doctorLoads).length || 0;
  
  if (averageLoad === 0) return '1-5 minutes';
  if (averageLoad <= 2) return '5-10 minutes';
  if (averageLoad <= 4) return '10-15 minutes';
  return '15+ minutes';
} 
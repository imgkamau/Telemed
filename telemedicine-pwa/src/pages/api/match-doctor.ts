import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '../../config/firebase-admin';
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
  res: NextApiResponse<MatchDoctorResponse | { 
    error: string; 
    details?: string;
    debug?: any;
  }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!adminDb) throw new Error('Database not initialized');

    const { specialty, symptoms = [] } = req.body as MatchDoctorRequest;
    console.log('Processing match request:', { 
      specialty, 
      symptoms: symptoms.length ? symptoms : 'No symptoms provided'
    });

    if (!specialty) {
      return res.status(400).json({ 
        error: 'Missing specialty',
        details: 'Specialty is required'
      });
    }

    const doctorsRef = adminDb.collection('doctors');
    const primaryQuery = doctorsRef
      .where('specialization', '==', specialty)
      .where('availability', '==', true)
      .limit(5);

    console.log('Executing primary query with:', {
      specialty,
      collection: 'doctors',
      conditions: {
        specialization: specialty,
        availability: true
      }
    });

    const querySnapshot = await primaryQuery.get();
    console.log('Query results:', {
      size: querySnapshot.size,
      empty: querySnapshot.empty,
      docs: querySnapshot.docs.map(d => d.id)
    });

    // Send debug info in response during development
    const debugInfo: {
      receivedSpecialty: string;
      dbInitialized: boolean;
      timestamp: string;
      environment: string;
      queryResults?: any;
    } = {
      receivedSpecialty: specialty,
      dbInitialized: !!adminDb,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    };

    // Include query results in debug info
    debugInfo.queryResults = {
      totalDocs: querySnapshot.size,
      isEmpty: querySnapshot.empty,
      docs: querySnapshot.docs.map(doc => ({
        id: doc.id,
        specialization: doc.data().specialization,
        availability: doc.data().availability
      }))
    };

    if (querySnapshot.empty) {
      console.log('No exact specialty match, trying fallback...');
      
      const fallbackQuery = doctorsRef
        .where('specialization', '==', 'General Practice')
        .where('availability', '==', true)
        .limit(3);

      const fallbackSnapshot = await fallbackQuery.get();
      console.log('Fallback query results:', {
        size: fallbackSnapshot.size,
        empty: fallbackSnapshot.empty,
        docs: fallbackSnapshot.docs.map(d => d.id)
      });
      
      if (fallbackSnapshot.empty) {
        console.log('Both primary and GP fallback failed, trying simple availability matching...');
        const simpleFallbackDoctors = await simpleFallbackMatching();
        
        if (simpleFallbackDoctors.length > 0) {
          return res.status(200).json({ 
            matchedDoctors: simpleFallbackDoctors,
            availabilityInfo: {
              doctorLoads: {},
              estimatedWaitTime: '10-15 minutes',
              timestamp: new Date().toISOString()
            },
            message: 'Matched with any available doctors (simple fallback)'
          });
        }
        
        // If even simple fallback fails, return no doctors found
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

      const fallbackDoctors = fallbackSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          specialization: data.specialization,
          availability: data.availability,
          experience: data.experience,
          rating: data.rating || 0,
          bio: data.bio || ''
        };
      });

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
        availability: data.availability,
        experience: data.experience,
        rating: data.rating || 0,
        bio: data.bio || ''
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
      details: error instanceof Error ? error.message : 'Unknown error',
      debug: process.env.NODE_ENV === 'development' ? {
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorStack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      } : undefined
    });
  }
}

async function calculateRealTimeAvailability(doctors: Doctor[]) {
  try {
    if (!adminDb) throw new Error('Database not initialized');
    const consultationsRef = adminDb.collection('consultations');
    const activeConsultations = consultationsRef
      .where('doctorId', 'in', doctors.map(d => d.id))
      .where('status', 'in', ['active', 'waiting']);

    const consultationsSnapshot = await activeConsultations.get();
    
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

async function simpleFallbackMatching() {
  try {
    if (!adminDb) throw new Error('Database not initialized');
    const doctorsRef = adminDb.collection('doctors');
    const simpleQuery = doctorsRef
      where('availability', '==', true),
      limit(5);

    const snapshot = await simpleQuery.get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        specialization: data.specialization,
        availability: data.availability,
        experience: data.experience,
        rating: data.rating || 0,
        bio: data.bio || ''
      };
    });
  } catch (error) {
    console.error('Simple fallback matching error:', error);
    return [];
  }
} 
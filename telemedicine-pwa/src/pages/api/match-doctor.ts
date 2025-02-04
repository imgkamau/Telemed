import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '../../config/firebase-admin';
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

// Rate limiting map
const requestCounts = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT = 10; // requests
const RATE_WINDOW = 60 * 1000; // 1 minute in milliseconds

// Helper for input sanitization
function sanitizeInput(input: string): string {
  return input.trim().replace(/[^\w\s-]/g, '');
}

// Helper for data validation
function validateAndSanitizeDoctor(doc: FirebaseFirestore.DocumentData): Doctor {
  return {
    id: doc.id,
    name: doc.name?.trim() || 'Unknown Doctor',
    specialization: doc.specialization?.trim() || 'General Practice',
    availability: Boolean(doc.availability),
    experience: typeof doc.experience === 'number' ? Math.max(0, doc.experience) : 0,
    rating: typeof doc.rating === 'number' ? Math.min(5, Math.max(0, doc.rating)) : 0,
    bio: doc.bio?.trim() || ''
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MatchDoctorResponse | { 
    error: string; 
    details?: string;
    debug?: any;
  }>
) {
  // Method validation
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  const clientRequests = requestCounts.get(String(clientIp));

  if (clientRequests) {
    if (now - clientRequests.timestamp < RATE_WINDOW && clientRequests.count >= RATE_LIMIT) {
      return res.status(429).json({ 
        error: 'Too many requests',
        details: 'Please try again later'
      });
    }
    if (now - clientRequests.timestamp >= RATE_WINDOW) {
      clientRequests.count = 1;
      clientRequests.timestamp = now;
    } else {
      clientRequests.count++;
    }
  } else {
    requestCounts.set(String(clientIp), { count: 1, timestamp: now });
  }

  try {
    // Database validation
    if (!adminDb) throw new Error('Database not initialized');

    // Input validation and sanitization
    const { specialty: rawSpecialty, symptoms = [] } = req.body as MatchDoctorRequest;
    const specialty = sanitizeInput(rawSpecialty);

    if (!specialty) {
      return res.status(400).json({ 
        error: 'Missing specialty',
        details: 'Specialty is required'
      });
    }

    console.log('Processing match request:', { 
      specialty, 
      symptoms: symptoms.length ? symptoms : 'No symptoms provided'
    });

    // Query with timeout
    const doctorsRef = adminDb.collection('doctors');
    const primaryQuery = doctorsRef
      .where('specialization', '==', specialty)
      .where('availability', '==', true)
      .limit(5);

    const queryPromise = primaryQuery.get();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), 10000)
    );

    const querySnapshot = await Promise.race([queryPromise, timeoutPromise])
      .catch(error => {
        if (error.message === 'Query timeout') {
          throw new Error('Service temporarily unavailable');
        }
        throw error;
      }) as FirebaseFirestore.QuerySnapshot;

    console.log('Query results:', {
      size: querySnapshot.size,
      empty: querySnapshot.empty,
      docs: querySnapshot.docs.map(d => d.id)
    });

    // Debug info with type safety
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
      environment: process.env.NODE_ENV || 'unknown'
    };

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

      const fallbackDoctors = fallbackSnapshot.docs.map(doc => 
        validateAndSanitizeDoctor({ id: doc.id, ...doc.data() })
      );

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

    const matchedDoctors = querySnapshot.docs.map(doc => 
      validateAndSanitizeDoctor({ id: doc.id, ...doc.data() })
    );

    const availabilityInfo = await calculateRealTimeAvailability(matchedDoctors);

    return res.status(200).json({ 
      matchedDoctors,
      availabilityInfo,
      message: 'Successfully matched with specialists'
    });

  } catch (error) {
    console.error('Doctor matching error:', error);
    
    // Enhanced error response
    const errorResponse = {
      error: 'Failed to match doctor',
      details: error instanceof Error ? error.message : 'Unknown error',
      errorCode: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString()
    };

    if (process.env.NODE_ENV === 'development') {
      return res.status(500).json({
        ...errorResponse,
        debug: {
          stack: error instanceof Error ? error.stack : undefined,
          env: process.env.NODE_ENV
        }
      });
    }

    return res.status(500).json(errorResponse);
  }
}

async function calculateRealTimeAvailability(doctors: Doctor[]) {
  try {
    if (!adminDb) throw new Error('Database not initialized');
    
    // Handle empty doctors array
    if (!doctors.length) {
      return {
        doctorLoads: {},
        estimatedWaitTime: '1-5 minutes',
        timestamp: new Date().toISOString()
      };
    }

    const consultationsRef = adminDb.collection('consultations');
    const activeConsultations = consultationsRef
      .where('doctorId', 'in', doctors.map(d => d.id))
      .where('status', 'in', ['active', 'waiting']);

    const consultationsSnapshot = await activeConsultations.get();
    
    const doctorLoads: { [key: string]: number } = {};
    doctors.forEach(doctor => {
      doctorLoads[doctor.id] = 0; // Initialize all doctors with 0 load
    });

    consultationsSnapshot.forEach(doc => {
      const consultation = doc.data();
      if (doctorLoads[consultation.doctorId] !== undefined) {
        doctorLoads[consultation.doctorId]++;
      }
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
  const loads = Object.values(doctorLoads);
  if (!loads.length) return '1-5 minutes';

  const averageLoad = loads.reduce((sum, load) => sum + load, 0) / loads.length;
  
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
      .where('availability', '==', true)
      .limit(5);

    const snapshot = await simpleQuery.get();
    return snapshot.docs.map(doc => 
      validateAndSanitizeDoctor({ id: doc.id, ...doc.data() })
    );
  } catch (error) {
    console.error('Simple fallback matching error:', error);
    return [];
  }
} 
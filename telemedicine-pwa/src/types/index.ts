export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  availability: boolean;
  isAvailable: boolean;
  isActive: boolean;
  rating: number;
  imageUrl: string;
  consultationFee: number;
  experience: number;
  languages: string[];
  canHandleGeneral: boolean;
}

export interface Assessment {
  specialty: string;
  urgency: 'low' | 'medium' | 'high';
  symptoms: string[];
  recommendConsultation: boolean;
}

export interface Consultation {
  id: string;
  patientId: string;
  doctorId: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  startTime: Date;
  patientInfo: {
    type: 'self' | 'child' | 'other';
    age?: number | null;
    primarySymptom: string;
    specialty: string;
    additionalSymptoms: string[];
  };
  assessment: Assessment;
  messages: Message[];
  prescription: Prescription | null;
  estimatedWaitTime?: string;
}

export interface Prescription {
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  instructions: string;
  issuedAt: Date;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface User {
  id: string;
  phoneNumber: string;
  email: string;
  role: 'doctor' | 'patient' | 'admin';
  specialization?: string;
}

export const COLLECTIONS = {
  DOCTORS: 'doctors',
  CONSULTATIONS: 'consultations',
  USERS: 'users'
} as const; 
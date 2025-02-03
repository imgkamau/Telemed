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
  doctorId: string;
  patientId: string;
  assessment: Assessment;
  status: 'waiting' | 'active' | 'completed';
  createdAt: Date;
  messages: Message[];
  prescription: Prescription | null;
  startTime: Date;
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
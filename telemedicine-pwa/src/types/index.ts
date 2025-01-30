export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  availability: boolean;
  rating: number;
  imageUrl: string;
  consultationFee: number;
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
  uid: string;
  phoneNumber: string | null;
  // ... other user properties
} 
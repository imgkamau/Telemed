export interface User {
    id: string;
    phoneNumber: string;
    name?: string;
    email?: string;
  }
  
  export interface Doctor {
    id: string;
    name: string;
    specialization: string;
    availability: boolean;
    rating: number;
    experience: number;  // Added this
    bio: string;
    imageUrl?: string;

  }
  
  export interface PatientInfo {
    type: 'self' | 'child' | 'other';
    age?: number | null;
    specialty: string;
    primarySymptom: string;
    additionalSymptoms: string[];
  }
  
  export interface PatientContact {
    email?: string;
    phone?: string;
  }
  
  export interface Consultation {
    id: string;
    patientId: string;
    doctorId: string;
    patientInfo: PatientInfo;
    patientContact: PatientContact;
    status: 'pending' | 'active' | 'completed' | 'cancelled';
    assessment: {
      specialty: string;
      urgency: 'low' | 'medium' | 'high';
      symptoms: string[];
      recommendConsultation: boolean;
    };
    createdAt: Date;
    startTime: Date;
    messages: any[]; // Define message type if needed
    prescription: any | null; // Define prescription type if needed
    estimatedWaitTime: string;
  }
  
  export interface Payment {
    id: string;
    consultationId: string;
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    paymentMethod: 'mpesa' | 'card';
    transactionId?: string;
  }
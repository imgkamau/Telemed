export interface DoctorAvailability {
  id: string;
  doctorId: string;
  availableDays: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[];
  availableHours: {
    start: string;
    end: string;
  }[];
  breaks: {
    start: string;
    end: string;
    day: string;
  }[];
  bookedSlots: {
    date: string;
    time: string;
    consultationId: string;
  }[];
}

export interface DoctorData {
  name: string;
  specialization: string;
  availability: boolean;
  rating: number;
  totalRatings: number;
  consultationFee: string;
  workingHours?: {
    start: Date;
    end: Date;
  };
}

export interface Appointment {
  id: string;
  patientName: string;
  dateTime: string;
  status: 'pending' | 'completed' | 'cancelled';
  symptoms: string;
}

export interface PendingConsultation {
  id: string;
  assessment: {
    recommendConsultation: boolean;
    specialty: string;
    symptoms: string[];
    urgency: 'low' | 'medium' | 'high';
  };
  createdAt: Date;
  doctorId: string;
  estimatedWaitTime: string;
  messages: any[];
  patientContact: {
    email: string;
    phone: string;
  };
  patientId: string;
  patientInfo: {
    additionalSymptoms: string[];
    age: number | null;
    primarySymptom: string;
    specialty: string;
    type: 'self' | 'child' | 'other';
  };
  prescription: null;
  startTime: Date;
  status: 'pending' | 'active' | 'completed';
} 
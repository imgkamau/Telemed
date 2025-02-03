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
  patientInfo: {
    type: 'self' | 'child' | 'other';
    age?: number;
    specialty: string;
    primarySymptom: string;
  };
  status: 'pending' | 'active' | 'completed';
  createdAt: Date;
} 
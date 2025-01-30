export interface Prescription {
  id: string;
  consultationId: string;
  patientId: string;
  doctorId: string;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes: string;
  }[];
  instructions: string;
  followUp: {
    recommended: boolean;
    date?: string;
    notes?: string;
  };
  createdAt: Date;
  status: 'active' | 'completed';
} 
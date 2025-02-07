export interface MedicalHistory {
  id: string;
  patientId: string;
  bloodGroup?: string;
  allergies: string[];
  chronicConditions: string[];
  familyHistory: {
    condition: string;
    relationship: string;
  }[];
  currentMedications: {
    name: string;
    dosage: string;
    frequency: string;
  }[];
  surgicalHistory: {
    procedure: string;
    date: Date;
    hospital: string;
  }[];
  vaccinations: {
    name: string;
    date: Date;
  }[];
  lastUpdated: Date;
  updatedBy: string;
  notes: string;
}

export interface ConsultationNote {
  id: string;
  consultationId: string;
  patientId: string;
  doctorId: string;
  date: Date;
  symptoms: string[];
  diagnosis: string;
  treatment: string;
  prescriptions: {
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes: string;
  }[];
  followUpDate?: Date;
  notes: string;
} 
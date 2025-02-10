export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  address: string;
}

export interface PatientBioData {
  // Personal Information
  fullName: string;
  idNumber: string;
  passportNumber?: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  
  // Contact Information
  email: string;
  phoneNumber: string;
  address: string;
  location: string; // City/Town
  
  // Emergency Contact
  emergencyContact: EmergencyContact;
  
  // System Fields
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  password: string;
}

export interface Patient extends PatientBioData {
  id: string;
  // Add any additional fields that might be needed for the patient dashboard
  consultationHistory?: string[];
  prescriptionHistory?: string[];
  medicalRecord?: {
    weight?: string;
    bloodPressure?: string;
    bloodGroup?: string;
    chronicIllnesses?: string[];
    familyHistory?: string;
  };
} 
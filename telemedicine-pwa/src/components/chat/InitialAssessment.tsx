interface Specialty {
  id: string;
  name: string;
  description: string;
  commonIssues: string[];
}

export const specialties: Specialty[] = [
  {
    id: 'pediatrics',
    name: 'Pediatrics (Children)',
    description: 'For patients under 18 years',
    commonIssues: ['Fever', 'Cough', 'Vaccination', 'Growth concerns', 'Childhood diseases']
  },
  {
    id: 'ophthalmology',
    name: 'Eye Care',
    description: 'Vision and eye-related issues',
    commonIssues: ['Vision problems', 'Eye pain', 'Redness', 'Eye infections', 'Vision changes']
  },
  {
    id: 'dermatology',
    name: 'Skin Care',
    description: 'Skin, hair, and nail conditions',
    commonIssues: ['Rashes', 'Acne', 'Skin infections', 'Allergic reactions', 'Hair loss']
  },
  {
    id: 'gastroenterology',
    name: 'Digestive Health',
    description: 'Digestive system and stomach issues',
    commonIssues: ['Stomach pain', 'Acid reflux', 'Digestive problems', 'Nausea', 'Food allergies']
  },
  {
    id: 'cardiology',
    name: 'Heart Care',
    description: 'Heart and cardiovascular issues',
    commonIssues: ['Chest pain', 'High blood pressure', 'Heart palpitations', 'Shortness of breath']
  },
  {
    id: 'orthopedics',
    name: 'Bone & Joint Care',
    description: 'Musculoskeletal system issues',
    commonIssues: ['Joint pain', 'Fractures', 'Back pain', 'Sports injuries', 'Arthritis']
  },
  {
    id: 'ent',
    name: 'Ear, Nose & Throat',
    description: 'ENT and respiratory issues',
    commonIssues: ['Sore throat', 'Ear infections', 'Sinus problems', 'Hearing issues', 'Allergies']
  },
  {
    id: 'dental',
    name: 'Dental Care',
    description: 'Oral and dental health',
    commonIssues: ['Toothache', 'Gum problems', 'Dental infections', 'Oral hygiene', 'Dental trauma']
  },
  {
    id: 'gynecology',
    name: 'Women\'s Health',
    description: 'Female reproductive health',
    commonIssues: ['Menstrual issues', 'Pregnancy concerns', 'Reproductive health', 'Family planning']
  },
  {
    id: 'mentalhealth',
    name: 'Mental Health',
    description: 'Psychological and emotional well-being',
    commonIssues: ['Anxiety', 'Depression', 'Stress', 'Sleep problems', 'Mood disorders']
  },
  {
    id: 'generalmed',
    name: 'General Medicine',
    description: 'General health concerns and consultations',
    commonIssues: ['Common cold', 'Flu', 'General checkup', 'Minor ailments', 'Health advice']
  },
  {
    id: 'urology',
    name: 'Urinary Health',
    description: 'Urinary system and male reproductive health',
    commonIssues: ['Urinary infections', 'Kidney stones', 'Prostate issues', 'Bladder problems']
  }
];

const PatientTypeSelection = {
  SELF: 'self',
  CHILD: 'child',
  OTHER: 'other'
}; 
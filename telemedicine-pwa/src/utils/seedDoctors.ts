import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

const sampleDoctors = [
  {
    name: "Dr. Sarah Johnson",
    specialization: "General Practitioner",
    availability: true,
    rating: 4.8,
    imageUrl: "https://example.com/doctor1.jpg" // Replace with actual image URL
  },
  {
    name: "Dr. Michael Chen",
    specialization: "Pediatrician",
    availability: true,
    rating: 4.9,
    imageUrl: "https://example.com/doctor2.jpg"
  },
  {
    name: "Dr. Emily Williams",
    specialization: "Dermatologist",
    availability: true,
    rating: 4.7,
    imageUrl: "https://example.com/doctor3.jpg"
  }
];

export async function seedDoctors() {
  try {
    const doctorsRef = collection(db, 'doctors');
    
    for (const doctor of sampleDoctors) {
      await addDoc(doctorsRef, {
        ...doctor,
        createdAt: new Date()
      });
    }
    
    console.log('Doctors seeded successfully');
  } catch (error) {
    console.error('Error seeding doctors:', error);
  }
} 
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

const sampleDoctors = [
  {
    name: "Dr. Sarah Johnson",
    specialization: "General Practitioner",
    availability: true,
    rating: 4.8,
    imageUrl: "https://source.unsplash.com/featured/?doctor,woman",
    consultationFee: 1000
  },
  {
    name: "Dr. Michael Chen",
    specialization: "Pediatrician",
    availability: true,
    rating: 4.9,
    imageUrl: "https://source.unsplash.com/featured/?doctor,man"
  },
  {
    name: "Dr. Emily Williams",
    specialization: "Dermatologist",
    availability: true,
    rating: 4.7,
    imageUrl: "https://source.unsplash.com/featured/?doctor"
  }
];

// Don't try to visit this URL directly in browser
// Instead, use fetch() to call it
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed. Please use POST request instead of visiting this URL directly.' 
    });
  }

  try {
    const doctorsRef = collection(db, 'doctors');
    
    for (const doctor of sampleDoctors) {
      await addDoc(doctorsRef, {
        ...doctor,
        createdAt: new Date()
      });
    }
    
    res.status(200).json({ message: 'Doctors seeded successfully' });
  } catch (error) {
    console.error('Error seeding doctors:', error);
    res.status(500).json({ message: 'Error seeding doctors' });
  }
} 
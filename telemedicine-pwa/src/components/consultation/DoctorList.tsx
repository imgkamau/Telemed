import { useState, useEffect } from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Button, 
  Rating,
  Skeleton 
} from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { Doctor } from '@/types';
import { useAuth } from '../../contexts/AuthContext';
import BookingModal from './BookingModal';
import { useRouter } from 'next/router';
import { CONSULTATION_FEE } from '../../config/constants';

export default function DoctorList() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        console.log('Starting to fetch doctors...'); // Debug log
        if (!db) throw new Error('Database not initialized');
        const doctorsRef = collection(db, 'doctors');
        console.log('Collection reference created'); // Debug log
        
        const querySnapshot = await getDocs(doctorsRef);
        console.log('Query snapshot received:', querySnapshot.size); // Debug log
        
        const doctorsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Doctor[];
        
        console.log('Processed doctors:', doctorsList); // Debug log
        setDoctors(doctorsList);
      } catch (error) {
        console.error('Error fetching doctors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const handleBooking = (doctor: Doctor) => {
    if (!user) {
      // Redirect to login if user is not authenticated
      router.push('/auth/login');
      return;
    }
    setSelectedDoctor(doctor);
    setBookingModalOpen(true);
  };

  const handlePaymentComplete = async (paymentData: any) => {
    try {
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: CONSULTATION_FEE,
          doctorId: selectedDoctor?.id,
          userId: user?.id,
          phoneNumber: user?.phoneNumber,
        }),
      });

      const data = await response.json();
      if (data.paymentId) {
        // Handle successful STK push initiation
        console.log('Payment initiated:', data);
      }
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3].map((skeleton) => (
          <Grid item xs={12} sm={6} md={4} key={skeleton}>
            <Card>
              <Skeleton variant="rectangular" height={140} />
              <CardContent>
                <Skeleton variant="text" />
                <Skeleton variant="text" width="60%" />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  // Add a debug message for empty doctors list
  if (doctors.length === 0) {
    return <Typography>No doctors found. Please seed the database.</Typography>;
  }

  return (
    <>
      <Grid container spacing={3}>
        {doctors.map((doctor) => (
          <Grid item xs={12} sm={6} md={4} key={doctor.id}>
            <Card>
              <CardMedia
                component="img"
                height="140"
                image={doctor.imageUrl || '/default-doctor.png'}
                alt={doctor.name}
              />
              <CardContent>
                <Typography gutterBottom variant="h6">
                  {doctor.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {doctor.specialization}
                </Typography>
                <Rating value={doctor.rating} readOnly />
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={() => handleBooking(doctor)}
                  disabled={!doctor.availability}
                  sx={{ mt: 2 }}
                >
                  {doctor.availability ? 'Book Consultation' : 'Unavailable'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {selectedDoctor && (
        <BookingModal
          open={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          doctor={selectedDoctor}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </>
  );
}
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, Paper, CircularProgress, Container } from '@mui/material';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import dynamic from 'next/dynamic';

const ZegoRoom = dynamic(
  () => import('../../components/video/ZegoRoom'),
  { ssr: false }
);

export default function ConsultationRoom() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [consultation, setConsultation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Setting up your consultation...');

  useEffect(() => {
    if (!id || !user) {
      console.log('Missing id or user:', { id, userId: user?.id });
      return;
    }

    if (!db) {
      console.error('Database not initialized');
      return;
    }

    console.log('Initializing consultation room:', id);
    const unsubscribe = onSnapshot(doc(db, 'consultations', id as string), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        console.log('Consultation data:', {
          id: doc.id,
          status: data.status,
          patientId: data.patientId,
          doctorId: data.doctorId
        });
        
        // Verify user is participant
        if (data.patientId !== user.id && data.doctorId !== user.id) {
          console.error('User not authorized for this consultation');
          router.push('/');
          return;
        }
        
        setConsultation(data);
      } else {
        console.error('Consultation not found');
        router.push('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, user]);

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            mt: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3
          }}
        >
          <CircularProgress size={60} />
          <Typography variant="h6" align="center">
            {loadingMessage}
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Please wait while we connect you with your doctor...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ p: 3 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Consultation with {consultation?.doctorName}
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Started at: {new Date(consultation?.startTime).toLocaleTimeString()}
          </Typography>
        </Paper>

        {/* Video consultation interface */}
        <Paper elevation={3} sx={{ p: 3, minHeight: '70vh' }}>
          {user && id && (
            <ZegoRoom
              roomId={id as string}
              userId={user.id}
              userName={user.email || user.phoneNumber || 'Patient'}
            />
          )}
        </Paper>
      </Box>
    </Container>
  );
} 
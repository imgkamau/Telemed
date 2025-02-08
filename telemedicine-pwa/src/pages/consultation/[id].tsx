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
    if (!id) return;

    // Show loading messages sequence
    const messages = [
      { text: 'Connecting to consultation room...', delay: 1000 },
      { text: 'Setting up secure video connection...', delay: 2000 },
      { text: 'Almost ready...', delay: 3000 }
    ];

    messages.forEach(({ text, delay }) => {
      setTimeout(() => setLoadingMessage(text), delay);
    });

    if (!db) return;
    const unsubscribe = onSnapshot(doc(db, 'consultations', id as string), (doc) => {
      if (doc.exists()) {
        setConsultation(doc.data());
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
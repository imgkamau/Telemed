import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, Paper, CircularProgress, Container, Button } from '@mui/material';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTermsAcceptance } from '../../hooks/useTermsAcceptance';
import TermsAndConditions from '../../components/TermsAndConditions';
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
  const [showVideo, setShowVideo] = useState(false);

  const {
    showTerms,
    handleAcceptTerms,
    handleDeclineTerms,
    checkTermsAcceptance
  } = useTermsAcceptance(user?.id || '');

  const isPatient = user?.role === 'patient';

  useEffect(() => {
    if (!id) return;

    const fetchConsultation = async () => {
      // Query consultation by roomId instead of consultation ID
      if (!db) throw new Error('Database not initialized');
      const consultationsRef = collection(db, 'consultations');
      const q = query(consultationsRef, where('roomId', '==', id));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const consultationData = querySnapshot.docs[0].data();
        setConsultation(consultationData);
      }
    };

    fetchConsultation();
  }, [id]);

  const handleJoinConsultation = () => {
    if (!checkTermsAcceptance()) {
      return; // This will show the terms modal
    }
    setShowVideo(true);
  };

  const handleTermsAccepted = () => {
    handleAcceptTerms();
    setShowVideo(true);
  };

  const handleTermsDeclined = () => {
    handleDeclineTerms();
    router.push('/patient/dashboard');
  };

  const renderVideoOrTerms = () => {
    if (!showVideo) {
      if (isPatient) {
        return (
          <Box 
            display="flex" 
            flexDirection="column"
            justifyContent="center" 
            alignItems="center" 
            height="100%"
            gap={2}
          >
            <Typography variant="h6">
              Please accept the terms and conditions to join the consultation
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleJoinConsultation}
            >
              View and Accept Terms & Conditions
            </Button>
          </Box>
        );
      } else {
        // For doctors, directly show join button
        return (
          <Box 
            display="flex" 
            flexDirection="column"
            justifyContent="center" 
            alignItems="center" 
            height="100%"
          >
            <Button
              variant="contained"
              color="primary"
              onClick={() => setShowVideo(true)}
            >
              Join Consultation
            </Button>
          </Box>
        );
      }
    }

    return (
      <ZegoRoom
        roomId={id as string}
        userId={user?.id || ''}
        userName={user?.email || user?.phoneNumber || ''}
      />
    );
  };

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
    <>
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

          <Paper elevation={3} sx={{ p: 3, minHeight: '70vh' }}>
            {renderVideoOrTerms()}
          </Paper>
        </Box>
      </Container>

      {isPatient && (
        <TermsAndConditions
          open={showTerms}
          onAccept={handleTermsAccepted}
          onDecline={handleTermsDeclined}
        />
      )}
    </>
  );
} 
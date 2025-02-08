import { Box, Typography, Paper, Chip, Button } from '@mui/material';
import { Consultation } from '../types';
import { useRouter } from 'next/router';

interface ConsultationHistoryProps {
  consultations: Consultation[];
  isDoctor?: boolean;
}

export const ConsultationHistory = ({ consultations, isDoctor }: ConsultationHistoryProps) => {
  const router = useRouter();

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Consultation History
      </Typography>
      {consultations.map((consultation) => (
        <Paper key={consultation.id} sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1">
            Status: {consultation.status}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Created: {new Date(consultation.createdAt).toLocaleString()}
          </Typography>
          <Typography variant="body2">
            Primary Symptom: {consultation.patientInfo.primarySymptom}
          </Typography>
          {consultation.status === 'active' && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              sx={{ mt: 1 }}
              onClick={() => router.push(`/consultation/${consultation.id}`)}
            >
              Join Consultation
            </Button>
          )}
          <Chip 
            label={consultation.status}
            color={consultation.status === 'completed' ? 'success' : 'primary'}
            size="small"
            sx={{ mt: 1 }}
          />
        </Paper>
      ))}
      {consultations.length === 0 && (
        <Typography color="text.secondary">
          No consultation history found.
        </Typography>
      )}
    </Box>
  );
};
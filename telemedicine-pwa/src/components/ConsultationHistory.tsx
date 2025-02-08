import { Box, Typography, Paper, Chip } from '@mui/material';
import { Consultation } from '../types';

interface ConsultationHistoryProps {
  consultations: Consultation[];
  isDoctor?: boolean;
}

export const ConsultationHistory = ({ consultations, isDoctor }: ConsultationHistoryProps) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Consultation History
      </Typography>
      {consultations.map((consultation) => (
        <Paper key={consultation.id} sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1">
            {isDoctor ? 
              `Patient ID: ${consultation.patientId}` : 
              `Doctor ID: ${consultation.doctorId}`
            }
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Date: {new Date(consultation.startTime).toLocaleString()}
          </Typography>
          <Chip 
            label={consultation.status}
            color={consultation.status === 'completed' ? 'success' : 'default'}
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
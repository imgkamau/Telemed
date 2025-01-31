import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';

interface MedicalRecordFormProps {
  consultationId: string;
  patientId: string;
  doctorId: string;
  patientPhone: string;
  onSubmit: () => void;
}

export default function MedicalRecordForm({
  consultationId,
  patientId,
  doctorId,
  patientPhone,
  onSubmit
}: MedicalRecordFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    diagnosis: '',
    prescription: '',
    notes: '',
    followUp: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/medical-records/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          consultationId,
          patientId,
          doctorId,
          patientPhone
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create medical record');
      }

      onSubmit();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Medical Record
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'grid', gap: 2 }}>
          <TextField
            required
            fullWidth
            multiline
            rows={2}
            name="diagnosis"
            label="Diagnosis"
            value={formData.diagnosis}
            onChange={handleChange}
          />

          <TextField
            fullWidth
            multiline
            rows={2}
            name="prescription"
            label="Prescription"
            value={formData.prescription}
            onChange={handleChange}
          />

          <TextField
            required
            fullWidth
            multiline
            rows={3}
            name="notes"
            label="Consultation Notes"
            value={formData.notes}
            onChange={handleChange}
          />

          <TextField
            fullWidth
            name="followUp"
            label="Follow-up Instructions"
            value={formData.followUp}
            onChange={handleChange}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ mt: 1 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Medical Record'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
} 
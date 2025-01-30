import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import type { Doctor } from '@/types';
import { initiatePayment } from '../../services/payment';

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  doctor: Doctor;
  onPaymentComplete: (paymentData: any) => Promise<void>;
}

export default function BookingModal({ open, onClose, doctor, onPaymentComplete }: BookingModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    reason: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/mock-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: '+254705910555', // Replace with actual user phone
          amount: 50
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        await onPaymentComplete(result);
        onClose(); // Close the modal after successful payment
        // You might want to show a success message or redirect
      }
    } catch (error) {
      console.error('Payment failed:', error);
      // Show error message to user
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Book Consultation with {doctor.name}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              type="date"
              label="Date"
              InputLabelProps={{ shrink: true }}
              value={bookingData.date}
              onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
              required
            />
            
            <FormControl required>
              <InputLabel>Time</InputLabel>
              <Select
                value={bookingData.time}
                label="Time"
                onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
              >
                <MenuItem value="09:00">9:00 AM</MenuItem>
                <MenuItem value="10:00">10:00 AM</MenuItem>
                <MenuItem value="11:00">11:00 AM</MenuItem>
                <MenuItem value="14:00">2:00 PM</MenuItem>
                <MenuItem value="15:00">3:00 PM</MenuItem>
                <MenuItem value="16:00">4:00 PM</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Reason for Consultation"
              multiline
              rows={4}
              value={bookingData.reason}
              onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Confirm Booking'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
} 
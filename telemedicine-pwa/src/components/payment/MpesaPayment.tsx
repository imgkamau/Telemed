import { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  CircularProgress 
} from '@mui/material';
import type { Payment } from '@/types';

interface MPesaPaymentProps {
  amount: number;
  consultationId: string;
  onSuccess: (payment: Payment) => void;
  onError: (error: string) => void;
}

export default function MPesaPayment({ 
  amount, 
  consultationId, 
  onSuccess, 
  onError 
}: MPesaPaymentProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payments/mpesa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          amount,
          consultationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Payment failed');
      }

      onSuccess(data.payment);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', p: 3 }}>
      <Typography variant="h6" gutterBottom>
        M-Pesa Payment
      </Typography>
      <Typography variant="body2" gutterBottom>
        Amount: KES {amount}
      </Typography>
      <TextField
        fullWidth
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        placeholder="254700000000"
        label="M-Pesa Phone Number"
        sx={{ mb: 2 }}
      />
      <Button
        fullWidth
        variant="contained"
        onClick={handlePayment}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Pay with M-Pesa'}
      </Button>
    </Box>
  );
}
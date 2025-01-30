import { useState } from 'react';
import { Box, TextField, Button, Typography, Container } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const { signInWithPhone, confirmOTP, error } = useAuth();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithPhone(phoneNumber);
      setShowOTP(true);
    } catch (err) {
      console.error('Error sending OTP:', err);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await confirmOTP(verificationCode);
    } catch (err) {
      console.error('Error confirming OTP:', err);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div id="recaptcha-container"></div>
        
        <Typography component="h1" variant="h5">
          {showOTP ? 'Enter Verification Code' : 'Login with Phone'}
        </Typography>
        
        {!showOTP ? (
          <Box component="form" onSubmit={handleSendOTP} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+254700000000"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Send Verification Code
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleVerifyOTP} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Verification Code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Verify Code
            </Button>
          </Box>
        )}
        
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </Box>
    </Container>
  );
} 
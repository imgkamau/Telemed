import { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Alert,
  CircularProgress 
} from '@mui/material';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';

export default function PhoneAuth() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithPhone, verifyCode } = useAuth();
  const router = useRouter();

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });
    }
  };

  const handleSendCode = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await signInWithPhone(phoneNumber);
      setConfirmationResult(result);
    } catch (err) {
      setError('Failed to send verification code');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!confirmationResult) return;
    
    try {
      setLoading(true);
      setError('');
      await verifyCode(confirmationResult, verificationCode);
      router.push('/doctors');
    } catch (err) {
      setError('Invalid verification code');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', p: 3 }}>
      <div id="recaptcha-container" />
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {!confirmationResult ? (
        <>
          <Typography variant="h6" gutterBottom>
            Enter your phone number
          </Typography>
          <TextField
            fullWidth
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+254700000000"
            disabled={loading}
            sx={{ mb: 2 }}
          />
          <Button 
            fullWidth 
            variant="contained"
            onClick={handleSendCode}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Send Code'}
          </Button>
        </>
      ) : (
        <>
          <Typography variant="h6" gutterBottom>
            Enter verification code
          </Typography>
          <TextField
            fullWidth
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="123456"
            disabled={loading}
            sx={{ mb: 2 }}
          />
          <Button 
            fullWidth 
            variant="contained"
            onClick={handleVerifyCode}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Verify Code'}
          </Button>
        </>
      )}
    </Box>
  );
}
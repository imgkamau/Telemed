import { useEffect, useState } from 'react';
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

  useEffect(() => {
    // Initialize reCAPTCHA when component mounts
    if (typeof window !== 'undefined' && !(window as any).recaptchaVerifier) {
      try {
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'normal',
          callback: (response: any) => {
            console.log('reCAPTCHA token:', response);
            // Store the token or trigger verification here if needed
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
            if ((window as any).recaptchaVerifier) {
              (window as any).recaptchaVerifier.clear();
              (window as any).recaptchaVerifier = null;
            }
          }
        });
        
        (window as any).recaptchaVerifier = verifier;
        verifier.render().then(() => {
          console.log('reCAPTCHA rendered successfully');
        }).catch((error) => {
          console.error('reCAPTCHA render error:', error);
        });
      } catch (error) {
        console.error('reCAPTCHA initialization error:', error);
      }
    }

    return () => {
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      }
    };
  }, []);

  const handleSendCode = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Format phone number if needed
      const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      console.log('Attempting to send code to:', formattedNumber);
      
      const result = await signInWithPhone(formattedNumber);
      setConfirmationResult(result);
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      setError(`Failed to send verification code: ${err.message}`);
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
          <div id="recaptcha-container" style={{ marginBottom: '1rem' }} />
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
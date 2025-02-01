import { useState } from 'react';
import { Box, TextField, Button, Typography, Container, Divider } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signInWithPhone, verifyCode, error, signInWithEmail, signInWithGoogle } = useAuth();
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await signInWithPhone(phoneNumber);
      setConfirmationResult(result);
      setShowOTP(true);
    } catch (err) {
      console.error('Error sending OTP:', err);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await verifyCode(confirmationResult, verificationCode);
    } catch (err) {
      console.error('Error confirming OTP:', err);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmail(email, password);
    } catch (err) {
      console.error('Error signing in with email:', err);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div id="recaptcha-container"></div>
        
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          {showOTP ? 'Enter Verification Code' : 'Login'}
        </Typography>
        
        {!showOTP ? (
          <>
            <Box component="form" onSubmit={handleSendOTP} sx={{ mt: 1, width: '100%' }}>
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

            <Divider sx={{ width: '100%', my: 3 }}>OR</Divider>

            <Box component="form" onSubmit={handleEmailSignIn} sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Sign in with Email
              </Button>
            </Box>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => signInWithGoogle()}
              sx={{ mt: 1 }}
            >
              Sign in with Google
            </Button>
          </>
        ) : (
          <Box component="form" onSubmit={handleVerifyOTP} sx={{ mt: 1, width: '100%' }}>
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
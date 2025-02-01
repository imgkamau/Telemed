import { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Container, 
  Divider,
  Paper,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Google as GoogleIcon, Phone as PhoneIcon, Email as EmailIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const { signInWithPhone, verifyCode, error, signInWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();

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
      router.push('/chat');
    } catch (err) {
      console.error('Error confirming OTP:', err);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmail(email, password);
      router.push('/chat');
    } catch (err) {
      console.error('Error signing in with email:', err);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      router.push('/chat');
    } catch (error: any) {
      console.error('Google sign in error:', error);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        mt: { xs: 4, sm: 8 }, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center' 
      }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
          <Typography 
            component="h1" 
            variant="h4" 
            sx={{ 
              mb: 4, 
              textAlign: 'center',
              fontWeight: 'bold',
              color: 'primary.main'
            }}
          >
            Welcome - Pata Nafuu
          </Typography>
          
          <div id="recaptcha-container"></div>
          
          {!showOTP ? (
            <>
              <Box component="form" onSubmit={handleSendOTP} sx={{ width: '100%' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Phone Number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+254700000000"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<PhoneIcon />}
                  sx={{ 
                    mt: 2, 
                    mb: 3,
                    py: 1.5,
                    borderRadius: 2
                  }}
                >
                  Send Verification Code
                </Button>
              </Box>

              <Divider sx={{ 
                width: '100%', 
                my: 3,
                "&::before, &::after": {
                  borderColor: "primary.light",
                },
              }}>
                <Typography color="textSecondary" sx={{ px: 2 }}>OR</Typography>
              </Divider>

              <Box component="form" onSubmit={handleEmailSignIn} sx={{ width: '100%' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<EmailIcon />}
                  sx={{ 
                    mt: 3, 
                    mb: 2,
                    py: 1.5,
                    borderRadius: 2
                  }}
                >
                  Sign in with Email
                </Button>
              </Box>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={handleGoogleSignIn}
                startIcon={<GoogleIcon />}
                sx={{ 
                  mt: 1,
                  py: 1.5,
                  borderRadius: 2,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2
                  }
                }}
              >
                Sign in with Google
              </Button>
            </>
          ) : (
            <Box component="form" onSubmit={handleVerifyOTP} sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Verification Code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ 
                  mt: 2,
                  py: 1.5,
                  borderRadius: 2
                }}
              >
                Verify Code
              </Button>
            </Box>
          )}
          
          {error && (
            <Typography 
              color="error" 
              sx={{ 
                mt: 2,
                textAlign: 'center',
                bgcolor: 'error.light',
                p: 2,
                borderRadius: 1
              }}
            >
              {error}
            </Typography>
          )}
        </Paper>
      </Box>
    </Container>
  );
} 
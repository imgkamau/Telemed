import { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Container, 
  Paper,
  InputAdornment,
  IconButton,
  Link
} from '@mui/material';
import { Email as EmailIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import NextLink from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signInWithEmail, error } = useAuth();
  const router = useRouter();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmail(email, password);
      router.push('/patient/dashboard');
    } catch (err) {
      console.error('Error signing in with email:', err);
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
              Sign in
            </Button>
          </Box>
          
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              Don't have an account?{' '}
              <NextLink href="/auth/patient-signup" passHref>
                <Link color="primary">Sign up here</Link>
              </NextLink>
            </Typography>
          </Box>

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
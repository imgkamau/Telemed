import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Container, Paper, Typography } from '@mui/material';
import PhoneAuth from '../../components/auth/PhoneAuth';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      router.push('/doctors');
    }
  }, [user, router]);

  return (
    <Container maxWidth="sm">
      <Paper 
        elevation={3} 
        sx={{ 
          mt: 8, 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center' 
        }}
      >
        <Typography component="h1" variant="h5" gutterBottom>
          Sign in to Telemedicine
        </Typography>
        <PhoneAuth />
      </Paper>
    </Container>
  );
} 
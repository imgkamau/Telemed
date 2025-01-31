import { useRouter } from 'next/router';
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import { LocalHospital, Person } from '@mui/icons-material';

export default function LandingPage() {
  const router = useRouter();

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h3" align="center" gutterBottom>
          Welcome to TeleMed
        </Typography>
        <Typography variant="h6" align="center" color="textSecondary" paragraph>
          Choose how you would like to proceed
        </Typography>

        <Grid container spacing={4} sx={{ mt: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Person sx={{ fontSize: 60, color: 'primary.main' }} />
                </Box>
                <Typography variant="h5" component="h2" gutterBottom align="center">
                  I am a Patient
                </Typography>
                <Typography color="textSecondary" align="center">
                  Get instant medical consultation with qualified doctors
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  fullWidth 
                  variant="contained" 
                  size="large"
                  onClick={() => router.push('/auth/login')}
                >
                  Continue as Patient
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <LocalHospital sx={{ fontSize: 60, color: 'primary.main' }} />
                </Box>
                <Typography variant="h5" component="h2" gutterBottom align="center">
                  I am a Doctor
                </Typography>
                <Typography color="textSecondary" align="center">
                  Join our platform to provide online consultations
                </Typography>
              </CardContent>
              <CardActions sx={{ flexDirection: 'column', gap: 1 }}>
                <Button 
                  fullWidth 
                  variant="contained" 
                  onClick={() => router.push('/doctor/login')}
                >
                  Login as Doctor
                </Button>
                <Button 
                  fullWidth 
                  variant="outlined"
                  onClick={() => router.push('/doctor/register')}
                >
                  Register as Doctor
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
} 
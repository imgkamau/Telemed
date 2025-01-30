import { Container, Typography, Grid } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import DoctorList from '../../components/consultation/DoctorList';

export default function DoctorsPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <Container>
        <Typography variant="h4" component="h1" gutterBottom>
          Available Doctors
        </Typography>
        <DoctorList />
      </Container>
    </ProtectedRoute>
  );
} 
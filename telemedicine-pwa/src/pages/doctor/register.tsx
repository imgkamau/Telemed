'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { SelectChangeEvent } from '@mui/material/Select';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';

interface DoctorFormData {
  name: string;
  specialization: string;
  licenseNumber: string;
  experience: string;
  phoneNumber: string;
  email: string;
  password: string;
  availability: boolean;
  bio: string;
}

export default function DoctorRegistration() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<DoctorFormData>({
    name: '',
    specialization: '',
    licenseNumber: '',
    experience: '',
    phoneNumber: '',
    email: '',
    password: '',
    availability: true,
    bio: ''
  });

  const specializations = [
    'General Practice',
    'Internal Medicine',
    'Pediatrics',
    'Cardiology',
    'Dermatology',
    'Psychiatry',
    'Orthopedics',
    // Add more specializations as needed
  ];

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.name || !formData.specialization || !formData.licenseNumber || !formData.email || !formData.password) {
        throw new Error('Please fill in all required fields');
      }

      // Create auth account for doctor
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

      // Create doctor profile in Firestore
      const doctorRef = doc(db, 'doctors', userCredential.user.uid);
      await setDoc(doctorRef, {
        name: formData.name,
        specialization: formData.specialization,
        licenseNumber: formData.licenseNumber,
        experience: formData.experience,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        availability: true,
        bio: formData.bio,
        userId: userCredential.user.uid,
        createdAt: new Date().toISOString(),
        status: 'pending',
        rating: 0,
        totalRatings: 0
      });

      router.push('/doctor/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Doctor Registration
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'grid', gap: 3 }}>
              <TextField
                required
                name="name"
                label="Full Name"
                value={formData.name}
                onChange={handleTextChange}
                fullWidth
              />

              <TextField
                required
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleTextChange}
                fullWidth
              />

              <TextField
                required
                name="password"
                label="Password"
                type="password"
                value={formData.password}
                onChange={handleTextChange}
                fullWidth
              />

              <FormControl required fullWidth>
                <InputLabel>Specialization</InputLabel>
                <Select
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleSelectChange}
                  label="Specialization"
                >
                  {specializations.map((spec) => (
                    <MenuItem key={spec} value={spec}>
                      {spec}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                required
                name="licenseNumber"
                label="Medical License Number"
                value={formData.licenseNumber}
                onChange={handleTextChange}
                fullWidth
              />

              <TextField
                required
                name="experience"
                label="Years of Experience"
                type="number"
                value={formData.experience}
                onChange={handleTextChange}
                fullWidth
              />

              <TextField
                name="bio"
                label="Professional Bio"
                value={formData.bio}
                onChange={handleTextChange}
                fullWidth
                multiline
                rows={4}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Submit Registration'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
} 
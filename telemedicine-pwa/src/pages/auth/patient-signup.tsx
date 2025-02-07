import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { PatientService } from '../../services/PatientService';
import { PatientBioData } from '../../types/patient';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { signup } from '../../firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const steps = ['Personal Information', 'Contact Details', 'Emergency Contact'];
const patientService = new PatientService();

export default function PatientSignup() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<PatientBioData>({
    fullName: '',
    idNumber: '',
    passportNumber: '',
    dateOfBirth: new Date(),
    gender: 'male',
    maritalStatus: 'single',
    email: user?.email || '',
    phoneNumber: '',
    address: '',
    location: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phoneNumber: '',
      address: ''
    },
    userId: user?.id || '',
    createdAt: new Date(),
    updatedAt: new Date(),
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const validateCurrentStep = (): boolean => {
    setError('');
    switch (activeStep) {
      case 0:
        if (!formData.fullName || !formData.idNumber || !formData.dateOfBirth || !formData.gender) {
          setError('Please fill in all required fields');
          return false;
        }
        break;
      case 1:
        if (!formData.email || !formData.phoneNumber || !formData.address) {
          setError('Please fill in all required fields');
          return false;
        }
        break;
      case 2:
        if (!formData.emergencyContact.name || !formData.emergencyContact.phoneNumber) {
          setError('Please fill in all required fields');
          return false;
        }
        break;
    }
    return true;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.password) {
        setError('Password is required');
        return;
      }
      const { user } = await signup(formData.email, formData.password);
      
      // 2. Then save additional user data to Firestore
      if (!db) throw new Error('Database not initialized');
      await setDoc(doc(db, 'patients', user.uid), {
        ...formData,
        id: user.uid,
        role: 'patient',
      });
      router.push('/auth/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEmergencyContactChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value
      }
    }));
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ID Number"
                value={formData.idNumber}
                onChange={(e) => handleInputChange('idNumber', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Passport Number (Optional)"
                value={formData.passportNumber}
                onChange={(e) => handleInputChange('passportNumber', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date of Birth"
                  value={formData.dateOfBirth}
                  onChange={(date) => handleInputChange('dateOfBirth', date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  label="Gender"
                  required
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Marital Status</InputLabel>
                <Select
                  value={formData.maritalStatus}
                  onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                  label="Marital Status"
                  required
                >
                  <MenuItem value="single">Single</MenuItem>
                  <MenuItem value="married">Married</MenuItem>
                  <MenuItem value="divorced">Divorced</MenuItem>
                  <MenuItem value="widowed">Widowed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="password"
                label="Password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location (City/Town)"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                required
              />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Emergency Contact Name"
                value={formData.emergencyContact.name}
                onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Relationship"
                value={formData.emergencyContact.relationship}
                onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Emergency Contact Phone"
                value={formData.emergencyContact.phoneNumber}
                onChange={(e) => handleEmergencyContactChange('phoneNumber', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Emergency Contact Address"
                value={formData.emergencyContact.address}
                onChange={(e) => handleEmergencyContactChange('address', e.target.value)}
                required
              />
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Patient Registration
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={(e) => {
              if (activeStep === steps.length - 1) {
                handleSubmit(e as any);
              } else {
                handleNext();
              }
            }}
          >
            {activeStep === steps.length - 1 ? 'Submit' : 'Next'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
} 
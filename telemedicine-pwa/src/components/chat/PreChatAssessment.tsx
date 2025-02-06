import React, { useState } from 'react';
import {
  Box,
  Container,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Grid,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import { Person, ChildCare, Group, ArrowForward } from '@mui/icons-material';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useRouter } from 'next/router';
import { specialties } from '../../components/chat/InitialAssessment';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '@/types';

export default function PreChatAssessment() {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [patientType, setPatientType] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [primarySymptom, setPrimarySymptom] = useState('');
  const router = useRouter();
  const { setPatientInfo } = useChat();
  const { user } = useAuth();

  const steps = ['Patient Type', 'Medical Specialty', 'Symptoms'];

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Who needs medical attention?
            </Typography>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              {[
                { value: 'self', icon: <Person />, label: 'Myself' },
                { value: 'child', icon: <ChildCare />, label: 'My Child' },
                { value: 'other', icon: <Group />, label: 'Someone Else' }
              ].map((option) => (
                <Grid item xs={12} sm={4} key={option.value}>
                  <Card 
                    onClick={() => setPatientType(option.value)}
                    sx={{
                      cursor: 'pointer',
                      transition: '0.3s',
                      transform: patientType === option.value ? 'scale(1.02)' : 'scale(1)',
                      border: patientType === option.value ? `2px solid ${theme.palette.primary.main}` : 'none',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        boxShadow: 3
                      }
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Box sx={{ mb: 2 }}>{option.icon}</Box>
                      <Typography>{option.label}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            {patientType !== 'self' && (
              <TextField
                fullWidth
                label="Patient's Age"
                type="number"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                sx={{ mt: 3 }}
              />
            )}
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Select Medical Specialty
            </Typography>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              {specialties.map((specialty) => (
                <Grid item xs={12} sm={6} md={4} key={specialty.id}>
                  <Card 
                    onClick={() => setSelectedSpecialty(specialty.id)}
                    sx={{
                      cursor: 'pointer',
                      transition: '0.3s',
                      height: '100%',
                      transform: selectedSpecialty === specialty.id ? 'scale(1.02)' : 'scale(1)',
                      border: selectedSpecialty === specialty.id ? `2px solid ${theme.palette.primary.main}` : 'none',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        boxShadow: 3
                      }
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {specialty.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {specialty.description}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {specialty.commonIssues.map((issue, index) => (
                          <Chip
                            key={index}
                            label={issue}
                            size="small"
                            sx={{ m: 0.5 }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Describe Your Symptoms
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Please describe your main symptoms or concerns"
              value={primarySymptom}
              onChange={(e) => setPrimarySymptom(e.target.value)}
              sx={{ mt: 2 }}
              placeholder="Example: I've been experiencing headaches for the past 3 days..."
            />
          </Box>
        );
    }
  };

  const isStepComplete = (step: number) => {
    switch (step) {
      case 0:
        return patientType && (patientType === 'self' || patientAge);
      case 1:
        return selectedSpecialty;
      case 2:
        return primarySymptom.length >= 10;
      default:
        return false;
    }
  };

  const handleStartChat = async () => {
    if (!user) return;
    
    try {
      const assessmentData = {
        type: patientType as 'self' | 'child' | 'other',
        age: patientAge ? parseInt(patientAge) : undefined,
        specialty: selectedSpecialty,
        primarySymptom,
      };

      // Store in context for AI chat
      setPatientInfo(assessmentData);
      
      // Create consultation request in Firestore
      if (!db) throw new Error('Database not initialized');
      const consultationRef = await addDoc(collection(db, 'consultations'), {
        patientId: user.id,
        patientContact: {
          email: user.email,
          phone: user.phoneNumber
        },
        patientInfo: assessmentData,
        status: 'pending',
        createdAt: new Date(),
      });
      
      // Redirect to AI chat first
      router.push('/chat');
      
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center" color="primary">
          Pre-Chat Assessment
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
          >
            Back
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleStartChat}
              disabled={!isStepComplete(activeStep)}
              endIcon={<ArrowForward />}
            >
              Start Chat
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!isStepComplete(activeStep)}
              endIcon={<ArrowForward />}
            >
              Next
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
} 
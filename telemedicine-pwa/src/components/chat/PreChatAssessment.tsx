import React, { useState } from 'react';
import { Box, Typography, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, TextField, InputLabel, Select, MenuItem, Button } from '@mui/material';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useRouter } from 'next/router';

export default function PreChatAssessment() {
  const [patientType, setPatientType] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [primarySymptom, setPrimarySymptom] = useState('');
  const router = useRouter();

  const startChat = async (assessmentData: {
    patientType: string;
    specialty: string;
    age?: string;
    primarySymptom: string;
  }) => {
    // Store assessment data and redirect to chat
    try {
      const chatSessionRef = await addDoc(collection(db, 'chatSessions'), {
        ...assessmentData,
        createdAt: new Date(),
        status: 'active'
      });
      router.push(`/chat/${chatSessionRef.id}`);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h6">Before we begin</Typography>
      
      {/* Who is the patient */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <FormLabel>Who needs medical attention?</FormLabel>
        <RadioGroup value={patientType} onChange={(e) => setPatientType(e.target.value)}>
          <FormControlLabel value="self" control={<Radio />} label="Myself" />
          <FormControlLabel value="child" control={<Radio />} label="My child" />
          <FormControlLabel value="other" control={<Radio />} label="Someone else" />
        </RadioGroup>
      </FormControl>

      {/* If for child or other, show age input */}
      {patientType !== 'self' && (
        <TextField
          fullWidth
          label="Patient's Age"
          type="number"
          value={patientAge}
          onChange={(e) => setPatientAge(e.target.value)}
          sx={{ mb: 2 }}
        />
      )}

      {/* Specialty Selection */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>What best describes your medical concern?</InputLabel>
        <Select
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
        >
          {specialties.map(specialty => (
            <MenuItem key={specialty.id} value={specialty.id}>
              <Box>
                <Typography>{specialty.name}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {specialty.description}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Primary Symptom */}
      <TextField
        fullWidth
        multiline
        rows={3}
        label="Briefly describe your main symptom or concern"
        value={primarySymptom}
        onChange={(e) => setPrimarySymptom(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Button 
        variant="contained" 
        fullWidth
        onClick={() => startChat({
          patientType,
          specialty: selectedSpecialty,
          age: patientAge,
          primarySymptom
        })}
      >
        Start Chat
      </Button>
    </Box>
  );
} 
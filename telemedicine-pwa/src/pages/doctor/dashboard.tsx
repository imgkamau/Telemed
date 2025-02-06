'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Switch,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  Tabs,
  Tab
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { WebSocketService } from '../../services/WebSocketService';
import { DoctorService } from '../../services/DoctorService';
import { PendingConsultation } from '../../types/doctor';


interface Appointment {
  id: string;
  patientName: string;
  dateTime: string;
  status: 'pending' | 'completed' | 'cancelled';
  symptoms: string;
}

interface WorkingHours {
  start: Date;
  end: Date;
}

interface DoctorData {
  name: string;
  specialization: string;
  availability: boolean;
  rating: number;
  totalRatings: number;
  consultationFee: string;
  workingHours?: WorkingHours;
}

interface Consultation {
  id: string;
  patientId: string;
  patientName: string;
  status: string;
  scheduledTime: string;
  symptoms: string;
}

// Initialize services outside the component
const webSocketService = new WebSocketService('wss://weblogger1029353476-api.coolzcloud.com/log');
const doctorService = new DoctorService();

export default function DoctorDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [doctorData, setDoctorData] = useState<DoctorData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showHoursDialog, setShowHoursDialog] = useState(false);
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    start: new Date(new Date().setHours(9, 0)),
    end: new Date(new Date().setHours(17, 0))
  });
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [pendingConsultations, setPendingConsultations] = useState<PendingConsultation[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        console.log('No user ID found');
        return;
      }

      try {
        setLoading(true);
        const doctorData = await doctorService.fetchDoctorData(user.id);
        const appointments = await doctorService.fetchAppointments(user.id);
        const pendingConsultations = await doctorService.fetchPendingConsultations(user.id);

        setDoctorData(doctorData);
        setAppointments(appointments);
        setPendingConsultations(pendingConsultations);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    webSocketService.connect();

    return () => {
      webSocketService.disconnect();
    };
  }, [user?.id]);

  const handleAvailabilityToggle = async () => {
    if (!user?.id || !doctorData) return;

    try {
      if (!db) throw new Error('Database not initialized');
      const doctorRef = doc(db, 'doctors', user.id);
      await updateDoc(doctorRef, {
        availability: !doctorData.availability
      });
      setDoctorData(prev => prev ? { ...prev, availability: !prev.availability } : null);
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  const handleWorkingHoursUpdate = async () => {
    if (!user?.id) return;

    try {
      if (!db) throw new Error('Database not initialized');
      const doctorRef = doc(db, 'doctors', user.id);
      await updateDoc(doctorRef, {
        workingHours
      });
      setDoctorData(prev => prev ? { ...prev, workingHours } : null);
      setShowHoursDialog(false);
    } catch (error) {
      console.error('Error updating working hours:', error);
    }
  };

  const handleJoinConsultation = (consultationId: string) => {
    window.location.href = `/consultation/${consultationId}`;
  };

  const acceptConsultation = async (consultationId: string) => {
    if (!user?.id) return;

    try {
      if (!db) throw new Error('Database not initialized');
      await updateDoc(doc(db, 'consultations', consultationId), {
        doctorId: user.id,
        status: 'active'
      });
      router.push(`/consultation/${consultationId}`);
    } catch (error) {
      console.error('Error accepting consultation:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!doctorData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h6" color="error">
          No doctor profile found. Please contact support.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Doctor Dashboard
        </Typography>

        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Upcoming Consultations" />
          <Tab label="Past Consultations" />
        </Tabs>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {consultations.map((consultation) => (
            <Grid item xs={12} md={6} key={consultation.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">
                    Patient: {consultation.patientName}
                  </Typography>
                  <Typography color="textSecondary">
                    Time: {new Date(consultation.scheduledTime).toLocaleString()}
                  </Typography>
                  <Typography>
                    Symptoms: {consultation.symptoms}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleJoinConsultation(consultation.id)}
                    sx={{ mt: 2 }}
                  >
                    Join Consultation
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Profile Summary
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                Name: {doctorData?.name}
              </Typography>
              <Typography variant="body1">
                Specialization: {doctorData?.specialization}
              </Typography>
              <Typography variant="body1">
                Rating: {doctorData?.rating.toFixed(1)} ({doctorData?.totalRatings} reviews)
              </Typography>
              <Typography variant="body1">
                Fee: KES {doctorData?.consultationFee}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Availability Controls */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Availability
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Switch
                checked={doctorData?.availability || false}
                onChange={handleAvailabilityToggle}
              />
              <Typography>
                {doctorData?.availability ? 'Available' : 'Unavailable'}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={() => setShowHoursDialog(true)}
              sx={{ mt: 2 }}
            >
              Set Working Hours
            </Button>
          </Paper>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Today's Stats
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                Pending Appointments: {
                  appointments.filter(apt =>
                    apt.status === 'pending' &&
                    new Date(apt.dateTime).toDateString() === new Date().toDateString()
                  ).length
                }
              </Typography>
              <Typography variant="body1">
                Completed Today: {
                  appointments.filter(apt =>
                    apt.status === 'completed' &&
                    new Date(apt.dateTime).toDateString() === new Date().toDateString()
                  ).length
                }
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Appointments Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Appointments
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Patient Name</TableCell>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Symptoms</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {appointments
                    .filter(apt => new Date(apt.dateTime) >= new Date())
                    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
                    .map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>{appointment.patientName}</TableCell>
                        <TableCell>
                          {new Date(appointment.dateTime).toLocaleString()}
                        </TableCell>
                        <TableCell>{appointment.symptoms}</TableCell>
                        <TableCell>
                          <Chip
                            label={appointment.status}
                            color={
                              appointment.status === 'completed' ? 'success' :
                                appointment.status === 'cancelled' ? 'error' : 'warning'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            size="small"
                            href={`/consultation/${appointment.id}`}
                          >
                            Join
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Pending Consultations */}
        <Grid item xs={12} md={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Pending Consultations
            </Typography>
            <Grid container spacing={2}>
              {pendingConsultations.map((consultation) => (
                <Grid item xs={12} md={4} key={consultation.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        New Consultation Request
                      </Typography>
                      {consultation.patientInfo ? (
                        <>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" color="primary">
                              Patient Details
                            </Typography>
                            <Typography>
                              Type: {consultation.patientInfo.type}
                              {consultation.patientInfo.age && ` (${consultation.patientInfo.age} years)`}
                            </Typography>
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" color="primary">
                              Medical Information
                            </Typography>
                            <Typography>
                              Specialty Requested: {consultation.patientInfo.specialty}
                            </Typography>
                            <Typography>
                              Primary Symptom: {consultation.patientInfo.primarySymptom}
                            </Typography>
                            {consultation.patientInfo.additionalSymptoms && (
                              <>
                                <Typography variant="subtitle2" sx={{ mt: 1 }}>
                                  Additional Symptoms:
                                </Typography>
                                <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                                  {consultation.patientInfo.additionalSymptoms.map((symptom, index) => (
                                    <li key={index}>
                                      <Typography>{symptom}</Typography>
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}
                            {consultation.patientInfo.notes && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="subtitle2">
                                  Additional Notes:
                                </Typography>
                                <Typography sx={{ fontStyle: 'italic' }}>
                                  {consultation.patientInfo.notes}
                                </Typography>
                              </Box>
                            )}
                          </Box>

                          <Box sx={{ mb: 1 }}>
                            <Typography color="textSecondary">
                              Requested: {new Date(consultation.createdAt).toLocaleString()}
                            </Typography>
                          </Box>
                        </>
                      ) : (
                        <Typography color="error">
                          Patient information not available
                        </Typography>
                      )}
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={() => acceptConsultation(consultation.id)}
                        sx={{ mt: 2 }}
                      >
                        Accept Consultation
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {pendingConsultations.length === 0 && (
                <Grid item xs={12}>
                  <Typography color="textSecondary" align="center">
                    No pending consultations
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Working Hours Dialog */}
      <Dialog open={showHoursDialog} onClose={() => setShowHoursDialog(false)}>
        <DialogTitle>Set Working Hours</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TimePicker
                label="Start Time"
                value={workingHours.start}
                onChange={(newValue) => {
                  if (newValue) {
                    setWorkingHours(prev => ({ ...prev, start: newValue }));
                  }
                }}
                renderInput={(params) => <TextField {...params} />}
              />
              <TimePicker
                label="End Time"
                value={workingHours.end}
                onChange={(newValue) => {
                  if (newValue) {
                    setWorkingHours(prev => ({ ...prev, end: newValue }));
                  }
                }}
                renderInput={(params) => <TextField {...params} />}
              />
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHoursDialog(false)}>Cancel</Button>
          <Button onClick={handleWorkingHoursUpdate} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 
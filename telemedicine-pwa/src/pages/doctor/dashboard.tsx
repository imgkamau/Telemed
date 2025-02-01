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
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

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

export default function DoctorDashboard() {
  const { user } = useAuth();
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

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        console.log('No user ID found');
        return;
      }

      try {
        console.log('Fetching doctor data for:', user.id);
        
        // Fetch doctor data
        const doctorRef = doc(db, 'doctors', user.id);
        const doctorSnap = await getDoc(doctorRef);
        
        if (doctorSnap.exists()) {
          console.log('Doctor data found:', doctorSnap.data());
          setDoctorData(doctorSnap.data() as DoctorData);
        } else {
          console.log('No doctor document found');
          // Add default data for new doctors
          const defaultDoctorData: DoctorData = {
            name: '',
            specialization: '',
            availability: true,
            rating: 0,
            totalRatings: 0,
            consultationFee: '0'
          };
          setDoctorData(defaultDoctorData);
        }

        // Fetch appointments
        console.log('Fetching appointments...');
        const appointmentsRef = collection(db, 'appointments');
        const q = query(appointmentsRef, where('doctorId', '==', user.id));
        const querySnapshot = await getDocs(q);
        
        const appointmentsList: Appointment[] = [];
        querySnapshot.forEach((doc) => {
          appointmentsList.push({ id: doc.id, ...doc.data() } as Appointment);
        });
        
        console.log('Appointments found:', appointmentsList.length);
        setAppointments(appointmentsList);

        // Fetch consultations
        console.log('Fetching consultations...');
        const consultationsRef = collection(db, 'consultations');
        const consultationsQ = query(
          consultationsRef,
          where('doctorId', '==', user.id)
        );
        const consultationsQuerySnapshot = await getDocs(consultationsQ);
        
        const consultationData: Consultation[] = [];
        consultationsQuerySnapshot.forEach((doc) => {
          consultationData.push({
            id: doc.id,
            ...doc.data()
          } as Consultation);
        });
        
        console.log('Consultations found:', consultationData.length);
        setConsultations(consultationData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleAvailabilityToggle = async () => {
    if (!user?.id || !doctorData) return;

    try {
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
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
  Tab,
  List,
  ListItem,
  ListItemText,
  IconButton
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
import { PatientService } from '../../services/PatientService';
import { Patient } from '../../types/patient';
import CloseIcon from '@mui/icons-material/Close';
import { ConsultationHistory } from '../../components/ConsultationHistory';
import type { Consultation as ConsultationType } from '../../types';
import TabPanel from '../../components/TabPanel';
import { calculateAge } from '../../utils/dateUtils';



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
  createdAt: Date;
  patientInfo: {
    age?: number;
    type?: string;
    additionalSymptoms?: string[];
    primarySymptom: string;
    specialty?: string;
  };
  doctorNotes?: string;
  diagnosis?: string;
  prescription?: {
    medications: {
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
    }[];
    instructions: string;
  };
}

interface ConsultationDetailsProps {
  consultation: {
    id: string;
    patientName: string;
    createdAt: Date;
    status: string;
    patientInfo?: {
      age?: number;
      type?: string;
      additionalSymptoms?: string[];
      primarySymptom?: string;
      specialty?: string;
    };
    doctorNotes?: string;
    diagnosis?: string;
    prescription?: {
      medications: {
        name: string;
        dosage: string;
        frequency: string;
        duration: string;
      }[];
      instructions: string;
    };
  }
}

// Initialize services outside the component
const webSocketService = new WebSocketService('wss://weblogger1029353476-api.coolzcloud.com/log');
const doctorService = new DoctorService();
const patientService = new PatientService();

interface PatientDetailsModalProps {
  open: boolean;
  onClose: () => void;
  patient: any; // Replace 'any' with your Patient interface
}

const PatientDetailsModal = ({ open, onClose, patient }: PatientDetailsModalProps) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Patient Details</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h5">{patient?.firstName} {patient?.lastName}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography><strong>Age:</strong> {patient?.age}</Typography>
            <Typography><strong>Gender:</strong> {patient?.gender}</Typography>
            <Typography><strong>Contact:</strong> {patient?.phoneNumber}</Typography>
            <Typography><strong>Email:</strong> {patient?.email}</Typography>
            <Typography><strong>Address:</strong> {patient?.address}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="h6">Emergency Contact</Typography>
            <Typography><strong>Name:</strong> {patient?.emergencyContact?.name}</Typography>
            <Typography><strong>Relationship:</strong> {patient?.emergencyContact?.relationship}</Typography>
            <Typography><strong>Phone:</strong> {patient?.emergencyContact?.phone}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6">Medical History</Typography>
            <Typography><strong>Allergies:</strong> {patient?.medicalHistory?.allergies || 'None'}</Typography>
            <Typography><strong>Chronic Conditions:</strong> {patient?.medicalHistory?.chronicConditions || 'None'}</Typography>
            <Typography><strong>Current Medications:</strong> {patient?.medicalHistory?.currentMedications || 'None'}</Typography>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

const ConsultationDetails = ({ consultation }: ConsultationDetailsProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card onClick={() => setOpen(true)} sx={{ cursor: 'pointer' }}>
        <CardContent>
          <Typography variant="h6">
            {consultation.patientName} - {new Date(consultation.createdAt).toLocaleDateString()}
          </Typography>
          <Typography color="textSecondary">
            Status: {consultation.status}
          </Typography>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Consultation Details</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6">Patient Information</Typography>
              <Typography>Age: {consultation.patientInfo?.age || 'Not specified'}</Typography>
              <Typography>Type: {consultation.patientInfo?.type || 'Self'}</Typography>
              <Typography>Additional Symptoms: {consultation.patientInfo?.additionalSymptoms?.join(', ') || 'None'}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6">Doctor Notes</Typography>
              <Typography>{consultation.doctorNotes || 'No notes recorded'}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6">Diagnosis</Typography>
              <Typography>{consultation.diagnosis || 'No diagnosis recorded'}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6">Prescription</Typography>
              {consultation.prescription ? (
                <>
                  <Typography variant="subtitle1">Medications:</Typography>
                  {consultation.prescription.medications.map((med, index) => (
                    <Typography key={index}>
                      • {med.name} - {med.dosage} ({med.frequency} for {med.duration})
                    </Typography>
                  ))}
                  <Typography variant="subtitle1" sx={{ mt: 1 }}>Instructions:</Typography>
                  <Typography>{consultation.prescription.instructions}</Typography>
                </>
              ) : (
                <Typography>No prescription given</Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </>
  );
};

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
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [consultationHistory, setConsultationHistory] = useState<ConsultationType[]>([]);
  const [myPatients, setMyPatients] = useState<Map<string, Patient>>(new Map());
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [pendingConsultationsWithPatients, setPendingConsultationsWithPatients] = useState<(PendingConsultation & { patientName: string })[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.id) return;
      const history = await doctorService.fetchConsultationHistory(user.id);
      setConsultationHistory(history);
    };
    fetchHistory();
  }, [user?.id]);

  useEffect(() => {
    const fetchPatients = async () => {
      if (!user?.id) return;
      try {
        const patientsData = await doctorService.fetchMyPatients(user.id);
        setMyPatients(patientsData);
      } catch (error) {
        console.error('Error fetching patients:', error);
      }
    };

    fetchPatients();
  }, [user?.id]);

  useEffect(() => {
    const fetchPendingWithPatients = async () => {
      if (!user?.id) return;
      try {
        const consultations = await doctorService.fetchPendingConsultations(user.id);
        
        // Fetch patient data for each consultation
        const withPatients = await Promise.all(
          consultations.map(async (consultation) => {
            const patientData = await doctorService.fetchPatientBioData(consultation.patientId);
            return {
              ...consultation,
              patientName: patientData?.fullName || 'Unknown Patient'
            };
          })
        );
        
        setPendingConsultationsWithPatients(withPatients);
      } catch (error) {
        console.error('Error fetching pending consultations:', error);
      }
    };

    fetchPendingWithPatients();
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
    console.log('Doctor joining consultation:', consultationId);
    window.location.href = `/consultation/${consultationId}`;
  };

  const acceptConsultation = async (consultationId: string) => {
    console.log('Doctor accepting consultation:', consultationId);
    if (!user?.id) return;
    
    try {
      if (!db) throw new Error('Database not initialized');
      const consultationRef = doc(db, 'consultations', consultationId);
      console.log('Updating consultation:', { doctorId: user.id, status: 'active' });
      
      await updateDoc(consultationRef, {
        doctorId: user.id,
        status: 'active'
      });
      
      console.log('Redirecting to consultation room:', consultationId);
      window.location.href = `/consultation/${consultationId}`;
    } catch (error) {
      console.error('Error accepting consultation:', error);
    }
  };

  const rejectConsultation = async (consultationId: string) => {
    if (!user?.id) return;

    try {
      if (!db) throw new Error('Database not initialized');
      await updateDoc(doc(db, 'consultations', consultationId), {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy: 'doctor'
      });
      
      // Remove from local state to update UI immediately
      setPendingConsultations(prev => 
        prev.filter(consultation => consultation.id !== consultationId)
      );
    } catch (error) {
      console.error('Error rejecting consultation:', error);
    }
  };

  const handleViewPatientDetails = async (patientId: string) => {
    try {
      const patientData = await patientService.getPatientById(patientId);
      setSelectedPatient(patientData);
      setShowPatientDetails(true);
    } catch (error) {
      console.error('Error fetching patient details:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePatientClick = (patient: any) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const handleConsultationClick = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setIsDialogOpen(true);
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

        <Box sx={{ width: '100%', mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
          >
            <Tab label="HOME" />
            <Tab label="PAST CONSULTATIONS" />
            <Tab label="MY PATIENTS" />
          </Tabs>

          {/* First Tab: Upcoming Consultations */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              {/* Profile Summary, Availability, Today's Stats stay at top */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Profile Summary</Typography>
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
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Availability</Typography>
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
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Today's Stats</Typography>
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

              {/* Upcoming Appointments Table */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Upcoming Appointments</Typography>
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
                                  onClick={() => handleJoinConsultation(appointment.id)}
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
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Pending Consultations</Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Patient Name</TableCell>
                          <TableCell>Symptoms</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pendingConsultationsWithPatients.map((consultation) => (
                          <TableRow key={consultation.id}>
                            <TableCell>{consultation.patientName}</TableCell>
                            <TableCell>{consultation.patientInfo.primarySymptom}</TableCell>
                            <TableCell>
                              <Chip label={consultation.status} color="warning" />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => acceptConsultation(consultation.id)}
                              >
                                Accept
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {pendingConsultationsWithPatients.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} align="center">
                              No pending consultations
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Second Tab: Past Consultations */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={2}>
              {consultations.map((consultation) => (
                <Grid item xs={12} key={consultation.id}>
                  <Card 
                    onClick={() => handleConsultationClick(consultation)}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#f5f5f5' }
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6">
                        Patient: {consultation.patientId}
                      </Typography>
                      <Typography>Status: {consultation.status}</Typography>
                      <Typography>
                        Created: {consultation.createdAt instanceof Date 
                          ? consultation.createdAt.toLocaleString()
                          : new Date(consultation.createdAt).toLocaleString()}
                      </Typography>
                      <Typography>Primary Symptom: {consultation.patientInfo?.primarySymptom || 'None'}</Typography>
                      <Typography>Specialty: {consultation.patientInfo?.specialty || 'General'}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Consultation Details Dialog */}
            <Dialog 
              open={isDialogOpen} 
              onClose={() => setIsDialogOpen(false)}
              maxWidth="md"
              fullWidth
            >
              <DialogTitle>Consultation Details</DialogTitle>
              <DialogContent>
                {selectedConsultation && (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="h6">Patient Information</Typography>
                      <Typography>Age: {selectedConsultation.patientInfo?.age || 'Not specified'}</Typography>
                      <Typography>Type: {selectedConsultation.patientInfo?.type || 'Self'}</Typography>
                      <Typography>Additional Symptoms: {selectedConsultation.patientInfo?.additionalSymptoms?.join(', ') || 'None'}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="h6">Doctor Notes</Typography>
                      <Typography>{selectedConsultation.doctorNotes || 'No notes recorded'}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="h6">Diagnosis</Typography>
                      <Typography>{selectedConsultation.diagnosis || 'No diagnosis recorded'}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="h6">Prescription</Typography>
                      {selectedConsultation.prescription ? (
                        <>
                          <Typography variant="subtitle1">Medications:</Typography>
                          {selectedConsultation.prescription.medications.map((med, index) => (
                            <Typography key={index}>
                              • {med.name} - {med.dosage} ({med.frequency} for {med.duration})
                            </Typography>
                          ))}
                          <Typography variant="subtitle1" sx={{ mt: 1 }}>Instructions:</Typography>
                          <Typography>{selectedConsultation.prescription.instructions}</Typography>
                        </>
                      ) : (
                        <Typography>No prescription given</Typography>
                      )}
                    </Grid>
                  </Grid>
                )}
              </DialogContent>
            </Dialog>
          </TabPanel>

          {/* Third Tab: My Patients */}
          <TabPanel value={tabValue} index={2}>
            <Paper sx={{ p: 3 }}>
              {loadingPatients ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {Array.from(myPatients.values()).map((patient) => (
                    <Grid item xs={12} md={6} key={patient.id}>
                      <Paper elevation={2} sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>{patient.fullName}</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="body2">
                            Age: {patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : 'N/A'}
                          </Typography>
                          <Typography variant="body2">
                            Contact: {patient.phoneNumber || patient.email}
                          </Typography>
                          <Typography variant="body2">
                            Last Consultation: {
                              consultationHistory
                                .find(c => c.patientId === patient.id)
                                ?.createdAt.toLocaleDateString()
                            }
                          </Typography>
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePatientClick(patient);
                          }}
                        >
                          View Details
                        </Button>
                      </Paper>
                    </Grid>
                  ))}
                  {myPatients.size === 0 && (
                    <Grid item xs={12}>
                      <Box textAlign="center" p={3}>
                        <Typography color="text.secondary">
                          No patient records found
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              )}
            </Paper>
          </TabPanel>
        </Box>
      </Box>

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

      {/* Patient Details Modal */}
      <PatientDetailsModal 
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        patient={selectedPatient}
      />
    </Container>
  );
} 
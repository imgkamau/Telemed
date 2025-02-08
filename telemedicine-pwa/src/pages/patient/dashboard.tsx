import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tab,
  Tabs,
  Button,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { PatientService } from '../../services/PatientService';
import { Patient } from '../../types/patient';
import { useRouter } from 'next/router';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ConsultationHistory } from '../../components/ConsultationHistory';
import { Consultation } from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const patientService = new PatientService();

export default function PatientDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [consultationHistory, setConsultationHistory] = useState<Consultation[]>([]);

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const patient = await patientService.getPatient(user.id);
        const consultationHistory = await patientService.getPatientConsultations(user.id);
        
        setPatientData(patient);
        setConsultations(consultationHistory);
      } catch (error) {
        console.error('Error fetching patient data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.id) return;
      const history = await patientService.fetchConsultationHistory(user.id);
      setConsultationHistory(history);
    };
    fetchHistory();
  }, [user?.id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleStartConsultation = async () => {
    try {
      // Check for active consultations
      if (!db) throw new Error('Database not initialized');
      const activeConsultations = await getDocs(     
        query(
          collection(db, 'consultations'),
          where('patientId', '==', user?.id),
          where('status', '==', 'active')
        )
      );

      if (!activeConsultations.empty) {
        // Either redirect to active consultation
        const activeConsultation = activeConsultations.docs[0];
        router.push(`/consultation/${activeConsultation.id}`);
        
        // Or show warning message
        setError('You have an active consultation. Please complete or end it before starting a new one.');
        return;
      }

      // If no active consultations, proceed to pre-assessment
      router.push('/pre-assessment');
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to check active consultations');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!patientData) {
    return (
      <Container>
        <Typography variant="h6" color="error">
          Patient profile not found. Please complete registration.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleStartConsultation}
              sx={{ minWidth: 200 }}
            >
              Start New Consultation
            </Button>
          </Paper>
        </Grid>

        {/* Patient Profile Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Profile Summary
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="Name" 
                  secondary={patientData.fullName} 
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="ID Number" 
                  secondary={patientData.idNumber} 
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="Date of Birth" 
                  secondary={new Date(patientData.dateOfBirth).toLocaleDateString()} 
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="Contact" 
                  secondary={`${patientData.phoneNumber} | ${patientData.email}`} 
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Main Content Area */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ width: '100%' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab label="Consultation History" />
              <Tab label="Prescriptions" />
              <Tab label="Medical Records" />
            </Tabs>

            {/* Consultation History */}
            <TabPanel value={tabValue} index={0}>
              <ConsultationHistory consultations={consultationHistory} />
            </TabPanel>

            {/* Prescriptions */}
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={2}>
                {consultations
                  .filter(c => c.prescription)
                  .map((consultation) => (
                    <Grid item xs={12} key={consultation.id}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6">
                            Prescription - {new Date(consultation.createdAt).toLocaleDateString()}
                          </Typography>
                          <Typography color="textSecondary" gutterBottom>
                            Dr. {consultation.doctorName || 'Unknown'}
                          </Typography>
                          <Typography variant="body2" component="pre">
                            {consultation.prescription}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                {!consultations.some(c => c.prescription) && (
                  <Grid item xs={12}>
                    <Typography color="textSecondary" align="center">
                      No prescriptions yet
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </TabPanel>

            {/* Medical Records */}
            <TabPanel value={tabValue} index={2}>
              <Typography variant="body1" color="textSecondary" align="center">
                Medical records will be available after your first consultation
              </Typography>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
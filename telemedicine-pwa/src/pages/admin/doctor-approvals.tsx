'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert
} from '@mui/material';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface DoctorApplication {
  id: string;
  name: string;
  specialization: string;
  licenseNumber: string;
  experience: string;
  education: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  email: string;
}

export default function DoctorApprovals() {
  const [applications, setApplications] = useState<DoctorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorApplication | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      if (!db) throw new Error('Database not initialized');
      const doctorsRef = collection(db, 'doctors');
      const q = query(doctorsRef, where('status', '==', 'pending'));
      const querySnapshot = await getDocs(q);
      
      const apps: DoctorApplication[] = [];
      querySnapshot.forEach((doc) => {
        apps.push({ id: doc.id, ...doc.data() } as DoctorApplication);
      });
      
      setApplications(apps.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      setError('Failed to fetch applications');
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (doctorId: string, newStatus: 'approved' | 'rejected') => {
    try {
      if (!db) throw new Error('Database not initialized');
      const doctorRef = doc(db, 'doctors', doctorId);
      await updateDoc(doctorRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()

      });
      
      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === doctorId ? { ...app, status: newStatus } : app
      ));
      
      setShowDetailsDialog(false);
    } catch (error) {
      setError('Failed to update status');
      console.error('Error updating status:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Doctor Applications
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Specialization</TableCell>
                <TableCell>License Number</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Applied On</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell>{doctor.name}</TableCell>
                  <TableCell>{doctor.specialization}</TableCell>
                  <TableCell>{doctor.licenseNumber}</TableCell>
                  <TableCell>
                    <Chip
                      label={doctor.status}
                      color={
                        doctor.status === 'approved' ? 'success' :
                        doctor.status === 'rejected' ? 'error' : 'warning'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(doctor.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setSelectedDoctor(doctor);
                        setShowDetailsDialog(true);
                      }}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Doctor Details Dialog */}
      <Dialog 
        open={showDetailsDialog} 
        onClose={() => setShowDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Application Details
        </DialogTitle>
        <DialogContent>
          {selectedDoctor && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedDoctor.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Email:</strong> {selectedDoctor.email}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Specialization:</strong> {selectedDoctor.specialization}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>License Number:</strong> {selectedDoctor.licenseNumber}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Experience:</strong> {selectedDoctor.experience} years
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Education:</strong>
              </Typography>
              <Typography variant="body2" sx={{ ml: 2, mb: 2 }}>
                {selectedDoctor.education}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsDialog(false)}>
            Close
          </Button>
          {selectedDoctor?.status === 'pending' && (
            <>
              <Button 
                onClick={() => handleStatusUpdate(selectedDoctor.id, 'rejected')}
                color="error"
              >
                Reject
              </Button>
              <Button 
                onClick={() => handleStatusUpdate(selectedDoctor.id, 'approved')}
                color="success"
                variant="contained"
              >
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
} 
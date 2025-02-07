import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { MedicalHistory } from '../types/medicalHistory';
import { MedicalHistoryService } from '../services/MedicalHistoryService';

interface MedicalHistoryManagerProps {
  patientId: string;
  doctorId: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const medicalHistoryService = new MedicalHistoryService();

export default function MedicalHistoryManager({ patientId, doctorId }: MedicalHistoryManagerProps) {
  const [tabValue, setTabValue] = useState(0);
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [dialogType, setDialogType] = useState<string>('');
  const [tempFormData, setTempFormData] = useState<any>({});

  useEffect(() => {
    loadMedicalHistory();
  }, [patientId]);

  const loadMedicalHistory = async () => {
    try {
      setLoading(true);
      const history = await medicalHistoryService.getMedicalHistory(patientId);
      if (history) {
        setMedicalHistory(history);
      } else {
        // Create new medical history if none exists
        await medicalHistoryService.createMedicalHistory(patientId, doctorId, {});
        const newHistory = await medicalHistoryService.getMedicalHistory(patientId);
        setMedicalHistory(newHistory);
      }
    } catch (error) {
      console.error('Error loading medical history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (category: keyof MedicalHistory) => {
    if (!medicalHistory) return;

    try {
      let updatedData: Partial<MedicalHistory> = {};
      
      switch (category) {
        case 'allergies':
        case 'chronicConditions':
          updatedData = {
            [category]: [...(medicalHistory[category] || []), newItem]
          };
          break;
        case 'currentMedications':
          updatedData = {
            currentMedications: [...(medicalHistory.currentMedications || []), tempFormData]
          };
          break;
        case 'surgicalHistory':
          updatedData = {
            surgicalHistory: [...(medicalHistory.surgicalHistory || []), tempFormData]
          };
          break;
        case 'familyHistory':
          updatedData = {
            familyHistory: [...(medicalHistory.familyHistory || []), tempFormData]
          };
          break;
        case 'vaccinations':
          updatedData = {
            vaccinations: [...(medicalHistory.vaccinations || []), tempFormData]
          };
          break;
      }

      await medicalHistoryService.updateMedicalHistory(patientId, doctorId, updatedData);
      await loadMedicalHistory();
      setNewItem('');
      setTempFormData({});
      setShowAddDialog(false);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleRemoveItem = async (category: keyof MedicalHistory, index: number) => {
    if (!medicalHistory) return;

    try {
      const items = medicalHistory[category];
      if (!Array.isArray(items)) return;
      
      const updatedItems = [...items];
      updatedItems.splice(index, 1);
      await medicalHistoryService.updateMedicalHistory(patientId, doctorId, {
        [category]: updatedItems
      });
      await loadMedicalHistory();
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleOpenAddDialog = (type: string) => {
    setDialogType(type);
    setShowAddDialog(true);
  };

  const renderAddDialog = () => {
    switch (dialogType) {
      case 'medication':
        return (
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                label="Medication Name"
                value={tempFormData.name || ''}
                onChange={(e) => setTempFormData({ ...tempFormData, name: e.target.value })}
                fullWidth
              />
              <TextField
                label="Dosage"
                value={tempFormData.dosage || ''}
                onChange={(e) => setTempFormData({ ...tempFormData, dosage: e.target.value })}
                fullWidth
              />
              <TextField
                label="Frequency"
                value={tempFormData.frequency || ''}
                onChange={(e) => setTempFormData({ ...tempFormData, frequency: e.target.value })}
                fullWidth
              />
            </Stack>
          </DialogContent>
        );
      // Add other dialog content types as needed
    }
  };

  return (
    <Paper sx={{ width: '100%', mt: 2 }}>
      <Tabs
        value={tabValue}
        onChange={(_, newValue) => setTabValue(newValue)}
        indicatorColor="primary"
        textColor="primary"
      >
        <Tab label="Basic Info" />
        <Tab label="Medical Conditions" />
        <Tab label="Medications" />
        <Tab label="History" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Blood Group</InputLabel>
              <Select
                value={medicalHistory?.bloodGroup || ''}
                onChange={async (e) => {
                  await medicalHistoryService.updateMedicalHistory(patientId, doctorId, {
                    bloodGroup: e.target.value
                  });
                  await loadMedicalHistory();
                }}
              >
                <MenuItem value="">None</MenuItem>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => (
                  <MenuItem key={group} value={group}>{group}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="General Notes"
              value={medicalHistory?.notes || ''}
              onChange={async (e) => {
                await medicalHistoryService.updateMedicalHistory(patientId, doctorId, {
                  notes: e.target.value
                });
                await loadMedicalHistory();
              }}
            />
          </Grid>
        </Grid>
      </TabPanel>

      {/* Add other tab panels for different sections */}

      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)}>
        <DialogTitle>Add {dialogType}</DialogTitle>
        {renderAddDialog()}
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => handleAddItem(dialogType as keyof MedicalHistory)}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
} 
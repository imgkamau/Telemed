import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  FormControlLabel,
  Checkbox
} from '@mui/material';

interface TermsAndConditionsProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function TermsAndConditions({ open, onAccept, onDecline }: TermsAndConditionsProps) {
  const [accepted, setAccepted] = useState(false);

  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>
        Terms and Conditions for Telemedicine Consultation
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Please read and accept these terms before proceeding with the consultation:
          </Typography>

          <List>
            <ListItem>
              <ListItemText
                primary="1. Nature of Service"
                secondary="You understand that telemedicine involves the delivery of healthcare services using electronic communications, information technology, or other means between a healthcare provider and a patient who are not in the same physical location."
              />
            </ListItem>

            <ListItem>
              <ListItemText
                primary="2. Medical Information and Privacy"
                secondary="You agree that the healthcare provider may share your medical information with other medical professionals if needed for your care. All medical information will be kept confidential in accordance with applicable laws and regulations."
              />
            </ListItem>

            <ListItem>
              <ListItemText
                primary="3. Limitations of Telemedicine"
                secondary="You understand that telemedicine has limitations and is not the same as direct in-person patient care. There are potential risks with telemedicine, including technology failures and security breaches."
              />
            </ListItem>

            <ListItem>
              <ListItemText
                primary="4. Emergency Situations"
                secondary="You understand that telemedicine is not for medical emergencies. In case of an emergency, you should immediately call emergency services or visit the nearest emergency room."
              />
            </ListItem>

            <ListItem>
              <ListItemText
                primary="5. Patient Responsibilities"
                secondary="You agree to provide accurate and complete information about your medical history, current medications, and symptoms. You will follow the treatment plan and instructions provided by the healthcare provider."
              />
            </ListItem>

            <ListItem>
              <ListItemText
                primary="6. Technical Requirements"
                secondary="You understand that you need a stable internet connection and appropriate device with camera and microphone for the consultation. Technical issues affecting the quality of communication are beyond the provider's control."
              />
            </ListItem>

            <ListItem>
              <ListItemText
                primary="7. Recording"
                secondary="You agree not to record (audio or video) the consultation without explicit permission from the healthcare provider."
              />
            </ListItem>

            <ListItem>
              <ListItemText
                primary="8. Payment and Cancellation"
                secondary="You understand the consultation fees and payment terms. Cancellation policies may apply as per the service terms."
              />
            </ListItem>
          </List>

          <Typography variant="body1" sx={{ mt: 2 }} color="error">
            By clicking "Accept", you acknowledge that you have read, understood, and agree to these terms and conditions.
          </Typography>
        </Box>
        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
            }
            label="I have read and agree to the terms and conditions"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onDecline} color="error">
          Decline
        </Button>
        <Button 
          onClick={onAccept} 
          variant="contained" 
          disabled={!accepted}
        >
          Accept
        </Button>
      </DialogActions>
    </Dialog>
  );
} 
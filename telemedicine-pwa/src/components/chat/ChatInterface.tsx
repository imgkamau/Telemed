import { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Paper, 
  Typography, 
  CircularProgress,
  Container,
  Avatar
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { CONSULTATION_FEE } from '../../config/constants';
import { useRouter } from 'next/router';
import { useNotification } from '../../contexts/NotificationContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Assessment {
  specialty: string;
  urgency: 'low' | 'medium' | 'high';
  symptoms: string[];
  recommendConsultation: boolean;
}

export default function ChatInterface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your medical assistant. Please describe your symptoms or health concerns.'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const [showPayment, setShowPayment] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const { consultationStatus, consultationId } = useNotification();

  useEffect(() => {
    if (consultationStatus === 'accepted') {
      // Redirect to consultation room
      router.push(`/consultation/${consultationId}`);
    }
  }, [consultationStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // If previous message was about consultation fee
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.content.includes('consultation fee is KES 50')) {
        if (input.toLowerCase().includes('yes')) {
          setShowPayment(true);
          return;
        } else if (input.toLowerCase().includes('no')) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'I understand. Is there anything else I can help you with?'
          }]);
          return;
        }
      }

      // Regular chat flow continues...
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.message 
      }]);

      if (data.requiresDoctor) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Based on your symptoms, I recommend consulting with a doctor. The consultation fee is KES 50. Would you like to proceed?' 
        }]);
        
        setAssessment(data.assessment);
        setShowPayment(true);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setLoading(true);

      // MOCK PAYMENT FOR TESTING
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful payment
      const mockPaymentSuccess = true;
      
      if (mockPaymentSuccess) {
        // Log the assessment data
        console.log('Assessment data:', assessment);
        
        const requestData = { 
          specialty: assessment?.specialty,
          symptoms: assessment?.symptoms
        };
        console.log('Sending to match-doctor:', requestData);

        // Match with doctor based on assessment
        const matchResponse = await fetch('/api/match-doctor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
        });

        const responseData = await matchResponse.json();
        console.log('Match doctor response:', responseData);

        if (responseData.matchedDoctors && responseData.matchedDoctors.length > 0) {
          // Create consultation
          const consultationRef = await addDoc(collection(db, 'consultations'), {
            patientId: user?.id,
            doctorId: responseData.matchedDoctors[0].id,
            status: 'pending',
            assessment: assessment,
            createdAt: new Date()
          });

          router.push(`/consultation/${consultationRef.id}`);
        } else {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Sorry, no doctors are currently available. Please try again later.'
          }]);
        }
      }

    } catch (error) {
      console.error('Payment error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your payment. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ height: '80vh', display: 'flex', flexDirection: 'column', mt: 2 }}>
        {/* Chat Header */}
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h6">Medical Assistant</Typography>
        </Box>

        {/* Messages Area */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto', 
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          {messages.map((msg, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                gap: 1
              }}
            >
              {msg.role === 'assistant' && (
                <Avatar sx={{ bgcolor: 'primary.main' }}>AI</Avatar>
              )}
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  maxWidth: '70%',
                  bgcolor: msg.role === 'user' ? 'primary.light' : 'grey.100',
                  color: msg.role === 'user' ? 'white' : 'text.primary'
                }}
              >
                <Typography>{msg.content}</Typography>
              </Paper>
              {msg.role === 'user' && (
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  {user?.phoneNumber?.[0] || 'U'}
                </Avatar>
              )}
            </Box>
          ))}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          )}
        </Box>

        {/* Input Area */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            p: 2,
            bgcolor: 'grey.100',
            display: 'flex',
            gap: 1
          }}
        >
          <TextField
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your symptoms..."
            variant="outlined"
            size="small"
            disabled={loading}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !input.trim()}
            endIcon={<SendIcon />}
          >
            Send
          </Button>
        </Box>
      </Paper>

      {/* Payment Dialog */}
      {showPayment && (
        <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Consultation fee: KES 50
          </Typography>
          <Button
            fullWidth
            variant="contained"
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Pay Now'}
          </Button>
        </Box>
      )}
    </Container>
  );
} 
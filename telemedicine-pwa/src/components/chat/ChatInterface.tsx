import { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Alert
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useAuth } from '../../contexts/AuthContext';
import { CONSULTATION_FEE } from '../../config/constants';

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
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: "Hello! I'm here to help understand your medical concern. Could you describe what's bothering you?"}]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, history: messages })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      
      if (data.assessment) {
        setAssessment(data.assessment);
        if (data.shouldPromptPayment) {
          setShowPayment(true);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!user?.phoneNumber) return;

    try {
      setLoading(true);
      const response = await fetch('/api/mock-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: user.phoneNumber,
          amount: CONSULTATION_FEE,
          assessment
        })
      });

      const data = await response.json();
      if (data.success && assessment) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Payment received! We are now matching you with a suitable doctor...'
        }]);
        // Trigger doctor matching only if assessment exists
        await matchDoctor(assessment);
      }
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  const matchDoctor = async (assessment: Assessment) => {
    try {
      const response = await fetch('/api/match-doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessment })
      });

      const data = await response.json();
      if (data.doctorId) {
        // Redirect to consultation room or show doctor details
      }
    } catch (error) {
      console.error('Matching error:', error);
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Paper 
        elevation={3} 
        sx={{ 
          flex: 1, 
          overflow: 'auto', 
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '70%'
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 2,
                bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.100',
                color: msg.role === 'user' ? 'white' : 'text.primary'
              }}
            >
              <Typography>{msg.content}</Typography>
            </Paper>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Paper>

      {showPayment && (
        <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Based on your symptoms, we recommend consulting with a doctor. 
            The consultation fee is KES {CONSULTATION_FEE}.
          </Alert>
          <Button
            fullWidth
            variant="contained"
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Proceed to Payment'}
          </Button>
        </Box>
      )}

      <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          disabled={loading}
          InputProps={{
            endAdornment: (
              <IconButton 
                onClick={handleSend} 
                disabled={loading || !input.trim()}
              >
                {loading ? <CircularProgress size={24} /> : <SendIcon />}
              </IconButton>
            )
          }}
        />
      </Box>
    </Box>
  );
} 
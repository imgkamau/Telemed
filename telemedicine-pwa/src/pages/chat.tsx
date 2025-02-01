import ChatInterface from '../components/chat/ChatInterface';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';

export default function ChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { patientInfo } = useChat();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  useEffect(() => {
    // If no assessment data, redirect to pre-assessment
    if (!patientInfo?.specialty) {
      router.push('/pre-assessment');
    }
  }, [patientInfo]);

  return <ChatInterface />;
} 
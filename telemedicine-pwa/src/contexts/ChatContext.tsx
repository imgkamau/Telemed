import { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  availability: boolean;
  rating: number;
  consultationFee: string;
  workingHours?: {
    start: Date;
    end: Date;
  };
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

interface ChatContext {
  patientInfo: {
    type: 'self' | 'child' | 'other';
    age?: number;
    specialty: string;
    primarySymptom: string;
  };
  messages: Message[];
  availableDoctors: Doctor[];
  findMatchingDoctor: (specialty: string) => Doctor[];
}

const ChatContext = createContext<ChatContext | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [patientInfo, setPatientInfo] = useState({
    type: 'self' as const,
    specialty: '',
    primarySymptom: ''
  });

  const findMatchingDoctor = (specialty: string) => {
    return availableDoctors.filter(doctor => 
      doctor.specialization === specialty && 
      doctor.availability === true
    );
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      const doctorsRef = collection(db, 'doctors');
      const doctorsSnap = await getDocs(doctorsRef);
      const doctors = doctorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Doctor));
      setAvailableDoctors(doctors);
    };

    fetchDoctors();
  }, []);

  return (
    <ChatContext.Provider value={{ 
      availableDoctors, 
      findMatchingDoctor,
      patientInfo,
      messages 
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
}; 
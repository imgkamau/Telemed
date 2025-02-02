import { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

interface Consultation {
  id: string;
  patientInfo: {
    type: 'self' | 'child' | 'other';
    age?: number;
    specialty: string;
    primarySymptom: string;
  };
  status: 'pending' | 'active' | 'completed';
  createdAt: Date;
  doctorId: string | null;
  specialty: string;
}

interface NotificationContextType {
  pendingConsultations: Consultation[];
  notifyDoctor: (consultation: Consultation) => Promise<void>;
  consultationStatus: 'waiting' | 'accepted' | 'none';
  consultationId: string | null;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [pendingConsultations, setPendingConsultations] = useState<Consultation[]>([]);
  const [consultationStatus, setConsultationStatus] = useState<'waiting' | 'accepted' | 'none'>('none');
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    // For doctors: Listen for pending consultations in their specialty
    if (user.role === 'doctor') {
      const q = query(
        collection(db, 'consultations'),
        where('status', '==', 'pending'),
        where('specialty', '==', user.specialization)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const consultations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Consultation));
        setPendingConsultations(consultations);
      });

      return () => unsubscribe();
    }

    // For patients: Listen for their active consultation
    if (user.role === 'patient') {
      const q = query(
        collection(db, 'consultations'),
        where('patientId', '==', user.id),
        where('status', 'in', ['pending', 'active'])
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const consultation = snapshot.docs[0]?.data();
        if (consultation) {
          setConsultationStatus(consultation.status === 'pending' ? 'waiting' : 'accepted');
        } else {
          setConsultationStatus('none');
        }
      });

      return () => unsubscribe();
    }
  }, [user]);

  const notifyDoctor = async (consultation: Consultation) => {
    try {
      // Here you could implement additional notification methods
      // like email, SMS, or push notifications
      console.log('Notifying doctor of new consultation:', consultation);
      
      // For now, we're just relying on real-time updates
      return Promise.resolve();
    } catch (error) {
      console.error('Error notifying doctor:', error);
      return Promise.reject(error);
    }
  };

  return (
    <NotificationContext.Provider 
      value={{ 
        pendingConsultations, 
        notifyDoctor,
        consultationStatus,
        consultationId 
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}; 
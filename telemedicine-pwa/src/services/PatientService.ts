import { db } from '../config/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  Firestore,
  orderBy
} from 'firebase/firestore';
import { Patient, PatientBioData } from '../types/patient';
import { Consultation } from '../types';


export class PatientService {
  private db: Firestore | undefined;

  constructor() {
    if (typeof window !== 'undefined') {
      this.db = db;
    }
  }

  async createPatient(userId: string, patientData: PatientBioData): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const patient: Patient = {
      ...patientData,
      id: userId,
      consultationHistory: [],
      prescriptionHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doc(this.db, 'patients', userId), patient);
  }

  async getPatient(userId: string): Promise<Patient | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const patientDoc = await getDoc(doc(this.db, 'patients', userId));
    if (!patientDoc.exists()) return null;
    
    return patientDoc.data() as Patient;
  }

  async updatePatient(userId: string, updates: Partial<PatientBioData>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    await updateDoc(doc(this.db, 'patients', userId), updateData);
  }

  async getPatientConsultations(userId: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const consultationsRef = collection(this.db, 'consultations');
    const q = query(consultationsRef, where('patientId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async getPatientById(patientId: string): Promise<Patient | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const patientDoc = await getDoc(doc(this.db, 'patients', patientId));
    if (!patientDoc.exists()) return null;
    
    return {
      id: patientDoc.id,
      ...patientDoc.data()
    } as Patient;
  }

  async fetchConsultationHistory(patientId: string): Promise<Consultation[]> {
    try {
      if (!this.db) throw new Error('Database not initialized');
      
      const q = query(
        collection(this.db, 'consultations'),
        where('patientId', '==', patientId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Consultation[];
    } catch (error) {
      console.error('Error fetching patient consultation history:', error);
      return [];
    }
  }
} 
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
  Timestamp 
} from 'firebase/firestore';
import { MedicalHistory, ConsultationNote } from '../types/medicalHistory';

export class MedicalHistoryService {
  async getMedicalHistory(patientId: string): Promise<MedicalHistory | null> {
    if (!db) throw new Error('Database not initialized');

    const historyDoc = await getDoc(doc(db, 'medicalHistories', patientId));
    if (!historyDoc.exists()) return null;

    return {
      id: historyDoc.id,
      ...historyDoc.data()
    } as MedicalHistory;
  }

  async updateMedicalHistory(
    patientId: string, 
    doctorId: string, 
    updates: Partial<MedicalHistory>
  ): Promise<void> {
    if (!db) throw new Error('Database not initialized');

    const updateData = {
      ...updates,
      lastUpdated: new Date(),
      updatedBy: doctorId
    };

    await updateDoc(doc(db, 'medicalHistories', patientId), updateData);
  }

  async createMedicalHistory(
    patientId: string, 
    doctorId: string, 
    data: Partial<MedicalHistory>
  ): Promise<void> {
    if (!db) throw new Error('Database not initialized');

    const medicalHistory: MedicalHistory = {
      id: patientId,
      patientId,
      allergies: [],
      chronicConditions: [],
      familyHistory: [],
      currentMedications: [],
      surgicalHistory: [],
      vaccinations: [],
      notes: '',
      ...data,
      lastUpdated: new Date(),
      updatedBy: doctorId
    };

    await setDoc(doc(db, 'medicalHistories', patientId), medicalHistory);
  }

  async addConsultationNote(note: Omit<ConsultationNote, 'id'>): Promise<string> {
    if (!db) throw new Error('Database not initialized');

    const notesRef = collection(db, 'consultationNotes');
    const noteDocRef = doc(notesRef);
    await setDoc(noteDocRef, {
      ...note,
      date: new Date()
    });

    return noteDocRef.id;
  }

  async getConsultationNotes(patientId: string): Promise<ConsultationNote[]> {
    if (!db) throw new Error('Database not initialized');

    const notesRef = collection(db, 'consultationNotes');
    const q = query(notesRef, where('patientId', '==', patientId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ConsultationNote[];
  }
} 
import { db, auth } from '../config/firebase';
import { doc, getDoc, collection, query, where, getDocs, Firestore, orderBy } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { DoctorData, Appointment, PendingConsultation } from '../types/doctor';
import { Consultation } from '../types';
import { Patient } from '../types/patient';


export class DoctorService {
    private db: Firestore | undefined;
    private auth: Auth | undefined;

    constructor() {
        // Only set these if we're on client side
        if (typeof window !== 'undefined') {
            this.db = db;
            this.auth = auth;
        }
    }

    async fetchDoctorData(userId: string): Promise<DoctorData | null> {
        try {
            if (!this.db || !this.auth?.currentUser) {
                console.warn('No database connection or authenticated user');
                return null;
            }
            console.log('Fetching doctor data for:', userId);
            const doctorRef = doc(this.db, 'doctors', userId);
            const doctorSnap = await getDoc(doctorRef);

            if (!doctorSnap.exists()) {
                console.log('No doctor data found');
                return null;
            }

            return doctorSnap.data() as DoctorData;
        } catch (error) {
            console.error('Error fetching doctor data:', error);
            throw error;
        }
    }

    async fetchAppointments(doctorId: string): Promise<Appointment[]> {
        try {
            if (!this.db || !this.auth?.currentUser) {
                console.warn('No database connection or authenticated user');
                return [];
            }
            const appointmentsRef = collection(this.db, 'appointments');
            const q = query(appointmentsRef, where('doctorId', '==', doctorId));
            const querySnapshot = await getDocs(q);
            
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Appointment[];
        } catch (error) {
            console.error('Error fetching appointments:', error);
            throw error;
        }
    }

    async fetchPendingConsultations(doctorId: string): Promise<PendingConsultation[]> {
        try {
            if (!this.db || !this.auth?.currentUser) {
                console.warn('No database connection or authenticated user');
                return [];
            }
            
            console.log('Fetching pending consultations for doctor:', doctorId);
            const consultationsRef = collection(this.db, 'consultations');
            const q = query(
                consultationsRef, 
                where('status', '==', 'pending'),
                where('doctorId', '==', doctorId)
            );
            
            const querySnapshot = await getDocs(q);
            console.log('Found pending consultations:', querySnapshot.size);
            
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as PendingConsultation[];
        } catch (error) {
            console.error('Error fetching pending consultations:', error);
            throw error;
        }
    }
    async fetchConsultationHistory(doctorId: string): Promise<Consultation[]> {
        try {
            if (!this.db) throw new Error('Database not initialized');
            
            const consultationsRef = collection(this.db, 'consultations');
            const q = query(
                consultationsRef,
                where('doctorId', '==', doctorId),
                where('status', 'in', ['active', 'completed']),
                orderBy('createdAt', 'desc')
            );
            
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                startTime: doc.data().startTime?.toDate()
            })) as Consultation[];
        } catch (error) {
            console.error('Error fetching consultation history:', error);
            return [];
        }
    }

    async fetchPatientBioData(patientId: string): Promise<Patient | null> {
        try {
            if (!this.db) throw new Error('Database not initialized');
            
            const patientRef = doc(this.db, 'patients', patientId);
            const patientSnap = await getDoc(patientRef);
            
            if (!patientSnap.exists()) {
                console.log('No patient data found');
                return null;
            }

            return {
                id: patientSnap.id,
                ...patientSnap.data()
            } as Patient;
        } catch (error) {
            console.error('Error fetching patient bio data:', error);
            return null;
        }
    }

    async fetchPatientsData(patientIds: string[]): Promise<Map<string, Patient>> {
        try {
            if (!this.db) throw new Error('Database not initialized');
            
            const patientsMap = new Map<string, Patient>();
            
            await Promise.all(
                patientIds.map(async (patientId) => {
                    const patientData = await this.fetchPatientBioData(patientId);
                    if (patientData) {
                        patientsMap.set(patientId, patientData);
                    }
                })
            );
            
            return patientsMap;
        } catch (error) {
            console.error('Error fetching multiple patients data:', error);
            return new Map();
        }
    }
}
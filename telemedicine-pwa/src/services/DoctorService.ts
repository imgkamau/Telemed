import { db } from '../config/firebase';
import { auth } from '../config/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { DoctorData, Appointment, PendingConsultation } from '../types/doctor';

export class DoctorService {
    constructor() {
        if (!auth.currentUser) {
            throw new Error('No authenticated user');
        }
    }

    async fetchDoctorData(userId: string): Promise<DoctorData | null> {
        try {
            if (!auth.currentUser) return null;
            console.log('Fetching doctor data for:', userId);
            const doctorRef = doc(db, 'doctors', userId);
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
            const appointmentsRef = collection(db, 'appointments');
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
            const consultationsRef = collection(db, 'consultations');
            const q = query(
                consultationsRef, 
                where('doctorId', '==', doctorId),
                where('status', '==', 'pending')
            );
            const querySnapshot = await getDocs(q);
            
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as PendingConsultation[];
        } catch (error) {
            console.error('Error fetching pending consultations:', error);
            throw error;
        }
    }
}
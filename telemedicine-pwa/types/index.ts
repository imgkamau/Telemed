export interface User {
    id: string;
    phoneNumber: string;
    name?: string;
    email?: string;
  }
  
  export interface Doctor {
    id: string;
    name: string;
    specialization: string;
    availability: boolean;
    rating: number;
    imageUrl?: string;
  }
  
  export interface Consultation {
    id: string;
    doctorId: string;
    userId: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    type: 'chat' | 'video' | 'voice';
    scheduledFor: Date;
    createdAt: Date;
  }
  
  export interface Payment {
    id: string;
    consultationId: string;
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    paymentMethod: 'mpesa' | 'card';
    transactionId?: string;
  }
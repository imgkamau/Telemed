export interface DoctorAvailability {
  id: string;
  doctorId: string;
  availableDays: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[];
  availableHours: {
    start: string;
    end: string;
  }[];
  breaks: {
    start: string;
    end: string;
    day: string;
  }[];
  bookedSlots: {
    date: string;
    time: string;
    consultationId: string;
  }[];
} 
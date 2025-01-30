interface Assessment {
  specialty: string;
  urgency: 'low' | 'medium' | 'high';
  symptoms: string[];
  recommendConsultation: boolean;
}

export function parseAIResponse(response: string): Assessment {
  // This will be filled by the AI's structured response
  return {
    specialty: '',
    urgency: 'low',
    symptoms: [],
    recommendConsultation: false
  };
} 
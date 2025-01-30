import OpenAI from 'openai';
import type { NextApiRequest, NextApiResponse } from 'next';
import { parseAIResponse } from '../../utils/medicalAssessment';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { message } = req.body;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a medical assistant. For any symptoms that:
          1. Persist for more than a few days
          2. Cause significant pain or discomfort
          3. Affect daily activities or sleep
          4. Could indicate a serious condition
          
          Respond with: ###requiresDoctor=true### followed by your message explaining why 
          a doctor consultation is recommended.
          
          For minor issues, provide self-care advice first, but escalate if symptoms persist.`
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    const aiResponse = completion.choices[0].message.content || '';
    const requiresDoctor = aiResponse.includes('###requiresDoctor=true###');
    const cleanResponse = aiResponse.replace('###requiresDoctor=true###', '').trim();
    const assessment = parseAIResponse(cleanResponse);

    res.status(200).json({ 
      message: cleanResponse,
      assessment,
      requiresDoctor
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ message: 'Error processing your request' });
  }
} 
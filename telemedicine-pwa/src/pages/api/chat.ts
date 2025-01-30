import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { parseAIResponse } from '../../utils/medicalAssessment';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM_PROMPT = `
You are a medical pre-screening assistant. Analyze patient symptoms and provide responses in this JSON format:
{
  "response": "Your natural response to the patient",
  "assessment": {
    "specialty": "required medical specialty",
    "urgency": "low|medium|high",
    "symptoms": ["list", "of", "symptoms"],
    "recommendConsultation": true|false
  }
}
Only include assessment when you have gathered enough information.
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, history } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...history,
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content || '{}';
    const aiResponse = JSON.parse(content);
    
    if (aiResponse.assessment) {
      // If assessment is complete, trigger payment flow
      res.status(200).json({ 
        message: aiResponse.response,
        assessment: aiResponse.assessment,
        shouldPromptPayment: aiResponse.assessment.recommendConsultation
      });
    } else {
      // Continue gathering information
      res.status(200).json({ 
        message: aiResponse.response
      });
    }
  } catch (error) {
    console.error('OpenAI error:', error);
    res.status(500).json({ error: 'Failed to process chat' });
  }
} 
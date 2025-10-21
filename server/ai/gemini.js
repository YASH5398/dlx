import { GoogleGenerativeAI } from '@google/generative-ai';
import AIContext from './context.js';

const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

async function generateAnswer(query, relevant = '') {
  const cached = AIContext.getResponse(query);
  if (cached) return cached;

  if (!genAI) {
    console.error('Missing GEMINI_API_KEY in environment');
    throw new Error('AI key missing');
  }

  try {
    const model = genAI.getGenerativeModel('gemini-pro');
    const composedPrompt = relevant
      ? `You are a helpful support assistant.\nContext:\n${relevant}\n\nUser question:\n${query}\n\nProvide a concise, helpful answer.`
      : query;
    const result = await model.generateContent(composedPrompt);
    const response = result.response.text();
    AIContext.addResponse(query, response);
    return response;
  } catch (error) {
    console.error('AI Error:', error);
    throw error;
  }
}

export { generateAnswer };
import { GoogleGenerativeAI } from '@google/generative-ai';
import AIContext from './context.js';

const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

async function generateAnswer(query, relevant = '', maxRetries = 2) {
  const cached = AIContext.getResponse(query);
  if (cached) return cached;

  if (!genAI) {
    console.error('Missing GEMINI_API_KEY in environment');
    throw new Error('AI service unavailable - API key missing');
  }

  let lastError = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const composedPrompt = relevant
        ? `You are a helpful support assistant for DigiLinex, a digital products platform.

Context Information:
${relevant}

User Question: ${query}

Please provide a concise, helpful answer based on the context. If the question is outside your knowledge, politely redirect them to contact support directly.`
        : `You are a helpful support assistant for DigiLinex, a digital products platform.

User Question: ${query}

Please provide a helpful answer. If you cannot answer the question, politely suggest they contact support directly.`;

      console.log(`Gemini API attempt ${attempt + 1}/${maxRetries} for query: ${query.substring(0, 50)}...`);
      
      const result = await model.generateContent(composedPrompt);
      const response = await result.response;
      
      if (!response) {
        throw new Error('Empty response from Gemini API');
      }
      
      const text = response.text();
      
      if (!text || text.trim().length === 0) {
        throw new Error('Empty text response from Gemini API');
      }
      
      console.log(`Gemini API success on attempt ${attempt + 1}`);
      AIContext.addResponse(query, text);
      return text;
      
    } catch (error) {
      lastError = error;
      console.error(`Gemini API attempt ${attempt + 1} failed:`, error.message);
      
      // If it's the last attempt, don't wait
      if (attempt < maxRetries - 1) {
        // Exponential backoff: wait 1s, then 2s
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  // All attempts failed
  console.error('All Gemini API attempts failed:', lastError);
  throw new Error(`AI service temporarily unavailable. Please try again in a moment.`);
}

export { generateAnswer };
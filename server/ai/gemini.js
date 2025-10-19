import { GoogleGenerativeAI } from '@google/generative-ai';
import AIContext from './context.js';

const apiKey = 'AIzaSyCDu1WN_2bx2BbYWL-Nx2BSpYPbddT-QVg';
const genAI = new GoogleGenerativeAI(apiKey);

async function getAIResponse(query) {
  const contextResponse = AIContext.getResponse(query);
  if (contextResponse) return contextResponse;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(query);
    const response = result.response.text();
    AIContext.addResponse(query, response);
    return response;
  } catch (error) {
    console.error('AI Error:', error);
    return 'Sorry, I couldn’t process your request. Please raise a ticket or contact a live agent.';
  }
}

export { getAIResponse as generateAnswer };
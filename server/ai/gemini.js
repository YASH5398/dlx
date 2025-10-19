import { GoogleGenerativeAI } from '@google/generative-ai';

let client = null;

export function getGeminiClient() {
  if (client) return client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
  client = new GoogleGenerativeAI(apiKey);
  return client;
}

export async function generateAnswer(userQuestion, siteContext) {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const systemPrompt = [
    'You are DigiLinex Support AI. Answer strictly using provided site context.',
    'If the answer is not present in the context, say: "I can only answer based on DigiLinex.com content. Please rephrase or check FAQs."',
    'Avoid hallucinations; do not invent facts. Keep responses concise and helpful.',
  ].join('\n');

  const prompt = `${systemPrompt}\n\nContext:\n${siteContext}\n\nUser Question:\n${userQuestion}`;
  const result = await model.generateContent(prompt);
  const text = result?.response?.text?.() || result?.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text.trim();
}
import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { Server as SocketIOServer } from 'socket.io';

import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

import admin from 'firebase-admin';

import Ticket from './models/Ticket.js';
import LiveChat from './models/LiveChat.js';
import Message from './models/Message.js';
import Agent from './models/Agent.js';
import AIContext from './ai/context.js';
import { generateAnswer } from './ai/gemini.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'https://digilinex-a80a9.web.app'];

const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Basic security, CORS & JSON

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer setup for optional file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});
const upload = multer({ storage });


// Firebase Admin SDK initialization
let serviceAccount = null;
const saStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (saStr) {
  try {
    serviceAccount = JSON.parse(saStr);
    if (serviceAccount?.private_key?.includes('\\n')) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
  } catch {
    serviceAccount = null;
  }
}

const credential = (serviceAccount && typeof serviceAccount.project_id === 'string')
  ? admin.credential.cert(serviceAccount)
  : admin.credential.applicationDefault();

if (!admin.apps.length) {
  admin.initializeApp({
    credential,
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount?.project_id,
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://digilinex-a80a9-default-rtdb.firebaseio.com'
  });
}

const db = admin.firestore();

// Placeholder for site context retrieval
async function getSiteContext() {
  // In a real application, this would fetch site-specific data from a database or file
  return {
    "general_info": "This is a support chatbot for a digital products platform.",
    "faq": "How can I reset my password? Visit the login page and click 'Forgot Password'."
  };
}

// Placeholder for context retrieval based on prompt
function retrieveContext(siteContext, prompt) {
  // In a real application, this would use a more sophisticated retrieval mechanism
  // For now, a simple keyword match or just returning the prompt
  if (prompt.toLowerCase().includes("password")) {
    return siteContext.faq;
  }
  return siteContext.general_info;
}

// Firestore helper functions
const getDoc = async (collection, docId) => {
  const docRef = db.collection(collection).doc(docId);
  const doc = await docRef.get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
};

const setDoc = async (collection, docId, data) => {
  const docRef = db.collection(collection).doc(docId);
  await docRef.set(data, { merge: true });
  return { id: docId, ...data };
};

// Track connected admins and users
const clients = {
  admins: new Map(), // socketId -> { userId }
  users: new Map(), // socketId -> { userId }
};

io.on('connection', (socket) => {
  // Identify role
  socket.on('identify', (payload) => {
    const { role, userId } = payload || {};
    if (role === 'admin') clients.admins.set(socket.id, { userId });
    else clients.users.set(socket.id, { userId });
  });

  socket.on('disconnect', () => {
    clients.admins.delete(socket.id);
    clients.users.delete(socket.id);
  });

  // Live chat messaging
  socket.on('chat:send', async ({ chatId, senderType, content }) => {
    if (!chatId || !content) return;
    const msg = await Message.create({ chat_id: chatId, sender_type: senderType, content, timestamp: Date.now() });
    io.to(chatId).emit('chat:message', msg);
  });

  // Join a specific chat room
  socket.on('chat:join', ({ chatId }) => {
    if (chatId) socket.join(chatId);
  });

  // AI Chatbot
  socket.on('ai:prompt', async ({ userId, content }) => {
    try {
      const site = await getSiteContext();
      const relevant = retrieveContext(site, content);
      // Record user prompt in history for AI chat
      await Message.create({ chat_id: `ai:${userId}`, sender_type: 'user', content, timestamp: Date.now() });
      
      // Notify admins about new AI chat message
      notifyAdmins('ai:chat:new', { 
        userId, 
        content, 
        timestamp: Date.now(),
        type: 'ai_chat'
      });
      
      const answer = await generateAnswer(content, relevant);
      const msg = await Message.create({ chat_id: `ai:${userId}`, sender_type: 'AI', content: answer, timestamp: Date.now() });
      socket.emit('ai:response', msg);
    } catch (e) {
      socket.emit('ai:error', { error: 'AI processing failed' });
    }
  });
});

// Helper to notify all admins
function notifyAdmins(event, payload) {
  for (const [sid] of clients.admins.entries()) {
    io.to(sid).emit(event, payload);
  }
}

// Agent availability endpoints
app.get('/api/agents/status', async (req, res) => {
  try {
    const agent = await getDoc('agents', 'mainAgent');
    const available = agent?.available ?? false;
    res.json({ available });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get status' });
  }
});

app.post('/api/agents/status', async (req, res) => {
  try {
    const { available } = req.body || {};
    const agent = (await getDoc('agents', 'mainAgent')) || (await setDoc('agents', 'mainAgent', { available: false }));
    agent.available = !!available;
    await setDoc('agents', 'mainAgent', { available: agent.available });
    io.emit('agent:status', { available: agent.available });
    res.json({ ok: true, available: agent.available });
  } catch (e) {
    res.status(500).json({ error: 'Failed to set status' });
  }
});

// Tickets API
app.post('/api/tickets', upload.single('file'), async (req, res) => {
  try {
    const { user_id, subject, category, description, priority } = req.body;
    if (!user_id || !subject || !category || !description) return res.status(400).json({ error: 'Missing fields' });

    const filePath = req.file ? `/uploads/${req.file.filename}` : undefined;
    const ticket = await Ticket.create({ user_id, subject, category, description, priority: (priority || 'medium'), status: 'Pending', file_path: filePath, created_at: Date.now() });
    notifyAdmins('ticket:new', { ticket });
    res.json(ticket);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

app.get('/api/tickets', async (req, res) => {
  try {
    const { user_id } = req.query;
    const tickets = await Ticket.find(user_id ? { user_id } : {}).sort({ created_at: -1 });
    res.json(tickets);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

app.put('/api/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assign_to } = req.body || {};
    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (status) ticket.status = status;
    if (assign_to) ticket.assign_to = assign_to;
    await ticket.save();
    res.json(ticket);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

app.post('/api/tickets/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { sender_type, content } = req.body || {};
    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    const msg = await Message.create({ chat_id: `ticket:${id}`, sender_type, content, timestamp: Date.now() });
    io.emit('ticket:reply', { ticketId: id, message: msg });
    res.json(msg);
  } catch (e) {
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

// Live chat API
app.post('/api/live-chats', async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'Missing user_id' });
    const chat = await LiveChat.create({ user_id, agent_id: null, messages: [], status: 'requested', started_at: Date.now() });
    notifyAdmins('livechat:new', { chat });
    res.json(chat);
  } catch (e) {
    res.status(500).json({ error: 'Failed to request chat' });
  }
});

app.post('/api/live-chats/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    const { agent_id } = req.body || {};
    const chat = await LiveChat.findById(id);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    chat.status = 'active';
    chat.agent_id = agent_id || 'admin';
    await chat.save();
    io.emit('livechat:accepted', { chatId: id, agent_id: chat.agent_id });
    res.json(chat);
  } catch (e) {
    res.status(500).json({ error: 'Failed to accept chat' });
  }
});

app.post('/api/live-chats/:id/decline', async (req, res) => {
  try {
    const { id } = req.params;
    const chat = await LiveChat.findById(id);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    chat.status = 'declined';
    await chat.save();
    io.emit('livechat:declined', { chatId: id });
    res.json(chat);
  } catch (e) {
    res.status(500).json({ error: 'Failed to decline chat' });
  }
});

app.get('/api/live-chats', async (req, res) => {
  try {
    const { user_id, status } = req.query;
    const filter = {};
    if (user_id) filter.user_id = user_id;
    if (status) filter.status = status;
    const chats = await LiveChat.find(filter).sort({ started_at: -1 });
    res.json(chats);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch live chats' });
  }
});

// Messages API (for history)
app.get('/api/messages', async (req, res) => {
  try {
    const { chat_id } = req.query;
    const filter = chat_id ? { chat_id } : {};
    const msgs = await Message.find(filter).sort({ timestamp: 1 });
    res.json(msgs);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Service Reviews API - fetch reviews for a service (dummy + real)
// GET /api/services/:serviceId/reviews
app.get('/api/services/:serviceId/reviews', async (req, res) => {
  try {
    const { serviceId } = req.params;
    if (!serviceId || typeof serviceId !== 'string') {
      return res.status(400).json({ error: 'Invalid or missing serviceId' });
    }

    const colRef = db.collection('services').doc(serviceId).collection('reviews');
    // Prefer server-side ordering when possible
    let snap;
    try {
      snap = await colRef.orderBy('createdAt', 'desc').get();
    } catch {
      snap = await colRef.get();
    }

    const reviews = [];
    snap.forEach((d) => {
      const r = d.data() || {};
      const created = r.createdAt;
      let createdAtIso = '';
      try {
        if (created && typeof created.toDate === 'function') {
          createdAtIso = created.toDate().toISOString();
        } else if (typeof created === 'string') {
          createdAtIso = new Date(created).toISOString();
        }
      } catch {}

      reviews.push({
        id: d.id,
        userName: r.userName || 'Anonymous',
        rating: Number(r.rating || 0),
        review: String(r.review || ''),
        isDummy: Boolean(r.isDummy || false),
        createdAt: createdAtIso,
      });
    });

    // Fallback client-side sort if needed
    reviews.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    if (reviews.length === 0) {
      return res.json({ reviews: [], message: 'No reviews yet.' });
    }

    return res.json({ reviews });
  } catch (e) {
    console.error('Failed to fetch service reviews:', e);
    return res.status(500).json({ error: 'Failed to fetch service reviews' });
  }
});

app.post('/api/support/tickets/:ticketId/ai-chat', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { prompt, user_id } = req.body;
    
    if (!ticketId || !prompt) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'ticketId and prompt are required' 
      });
    }

    console.log(`Processing AI chat for ticket ${ticketId}: ${prompt.substring(0, 50)}...`);

    const site = await getSiteContext();
    const relevant = retrieveContext(site, prompt);
    const reply = await generateAnswer(prompt, relevant);

    // Save AI response to Firestore
    const messagesRef = db.collection('supportTickets').doc(ticketId).collection('messages');
    await messagesRef.add({
      senderType: 'AI',
      content: reply || 'I apologize, but I encountered an issue processing your request. Please try again or contact support directly.',
      userId: user_id || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`AI response saved for ticket ${ticketId}`);
    res.json({ 
      success: true, 
      reply,
      message: 'AI response generated and saved successfully' 
    });
    
  } catch (e) {
    console.error('Ticket AI Chat Error:', e);
    
    // Try to save error message to chat
    try {
      const messagesRef = db.collection('supportTickets').doc(req.params.ticketId).collection('messages');
      await messagesRef.add({
        senderType: 'AI',
        content: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment or contact support directly.',
        userId: req.body.user_id || null,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (saveError) {
      console.error('Failed to save error message:', saveError);
    }
    
    res.status(500).json({ 
      error: 'AI processing failed',
      details: e.message || 'Unknown error occurred',
      retry: true
    });
  }
});

// General AI chatbot endpoint used by Support.tsx AI tab
app.post('/api/ai-chat', async (req, res) => {
  try {
    const { prompt, userId } = req.body || {};
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Invalid prompt',
        details: 'Prompt is required and must be a non-empty string' 
      });
    }

    console.log(`Processing AI chat for user ${userId || 'anonymous'}: ${prompt.substring(0, 50)}...`);

    const site = await getSiteContext();
    const relevant = retrieveContext(site, prompt.trim());
    const reply = await generateAnswer(prompt.trim(), relevant);

    console.log(`AI chat response generated successfully`);
    
    return res.json({ 
      success: true,
      reply: reply || 'I apologize, but I couldn\'t generate a proper response. Please try rephrasing your question or contact support.',
      timestamp: new Date().toISOString()
    });
    
  } catch (e) {
    console.error('AI Chat Error:', e);
    
    return res.status(500).json({ 
      error: 'AI processing failed',
      details: e.message || 'Unknown error occurred',
      retry: true,
      fallbackMessage: 'I\'m experiencing technical difficulties. Please try again in a moment or contact support directly.'
    });
  }
});

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Admin API
import adminRouter from './routes/admin.js';
import transactionsRouter from './routes/transactions.js';
import depositCheckRouter from './routes/depositCheck.js';
import manualDepositsRouter from './routes/manualDeposits.js';
app.use('/api/admin', adminRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/deposit-check', depositCheckRouter);
app.use('/api/manual-deposits', manualDepositsRouter);

const PORT = process.env.PORT || 4000;
console.log(`Attempting to start server on port ${PORT}...`);
server.listen(PORT, () => {
  console.log(`Support server listening on http://localhost:${PORT}`);
});
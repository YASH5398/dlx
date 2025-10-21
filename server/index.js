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

const io = new SocketIOServer(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5175'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Basic security, CORS & JSON
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: ['http://localhost:5176', 'http://localhost:5177'],
  credentials: true,
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
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID,
  databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://digilinex-a80a9-default-rtdb.firebaseio.com'
});

const db = admin.firestore();

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

app.post('/api/ai-chat', async (req, res) => {
  try {
    const { prompt, userId } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const site = await getSiteContext();
    const relevant = retrieveContext(site, prompt);
    const answer = await generateAnswer(prompt, relevant);

    res.json({ reply: answer });
  } catch (e) {
    console.error('AI Chat Error:', e);
    res.status(500).json({ error: 'AI processing failed' });
  }
});

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Admin API
import adminRouter from './routes/admin.js';
app.use('/api/admin', adminRouter);

const PORT = process.env.PORT || 4000;
console.log(`Attempting to start server on port ${PORT}...`);
server.listen(PORT, () => {
  console.log(`Support server listening on http://localhost:${PORT}`);
});
import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

import Ticket from './models/Ticket.js';
import LiveChat from './models/LiveChat.js';
import Message from './models/Message.js';
import Agent from './models/Agent.js';
import { getSiteContext, retrieveContext } from './ai/context.js';
import { getGeminiClient, generateAnswer } from './ai/gemini.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Basic CORS & JSON
app.use(cors({ origin: ['http://localhost:5173'], credentials: true }));
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

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/digilinex_support';
mongoose
  .connect(MONGODB_URI, { autoIndex: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

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
    const agent = await Agent.findOne();
    const available = agent?.available ?? false;
    res.json({ available });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get status' });
  }
});

app.post('/api/agents/status', async (req, res) => {
  try {
    const { available } = req.body || {};
    const agent = (await Agent.findOne()) || (await Agent.create({ available: false }));
    agent.available = !!available;
    await agent.save();
    io.emit('agent:status', { available: agent.available });
    res.json({ ok: true, available: agent.available });
  } catch (e) {
    res.status(500).json({ error: 'Failed to set status' });
  }
});

// Tickets API
app.post('/api/tickets', upload.single('file'), async (req, res) => {
  try {
    const { user_id, subject, category, description } = req.body;
    if (!user_id || !subject || !category || !description) return res.status(400).json({ error: 'Missing fields' });

    const filePath = req.file ? `/uploads/${req.file.filename}` : undefined;
    const ticket = await Ticket.create({ user_id, subject, category, description, status: 'Pending', file_path: filePath, created_at: Date.now() });
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

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Support server listening on http://localhost:${PORT}`);
});
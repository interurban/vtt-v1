import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
fs.mkdirSync('uploads', { recursive: true });
const upload = multer({ dest: 'uploads/' });

// simple in-memory store for sessions
const sessions = {};

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.post('/api/session/:sessionId/map', upload.single('map'), (req, res) => {
  const { sessionId } = req.params;
  if (!sessions[sessionId]) sessions[sessionId] = { tokens: [] };
  const file = req.file;
  sessions[sessionId].map = `/uploads/${file.filename}`;
  io.to(sessionId).emit('map:update', sessions[sessionId].map);
  res.json({ url: sessions[sessionId].map });
});

app.get('/api/session/:sessionId/state', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions[sessionId] || { tokens: [] };
  res.json(session);
});

io.on('connection', (socket) => {
  socket.on('join', (sessionId) => {
    socket.join(sessionId);
    if (!sessions[sessionId]) sessions[sessionId] = { tokens: [] };
    socket.emit('session:init', sessions[sessionId]);
  });

  socket.on('token:update', ({ sessionId, token }) => {
    const session = sessions[sessionId];
    if (!session) return;
    const idx = session.tokens.findIndex((t) => t.id === token.id);
    if (idx === -1) session.tokens.push(token); else session.tokens[idx] = token;
    io.to(sessionId).emit('token:update', token);
  });

  socket.on('token:remove', ({ sessionId, id }) => {
    const session = sessions[sessionId];
    if (!session) return;
    session.tokens = session.tokens.filter(t => t.id !== id);
    io.to(sessionId).emit('token:remove', id);
  });

  socket.on('initiative:update', ({ sessionId, order }) => {
    const session = sessions[sessionId];
    if (!session) return;
    session.initiative = order;
    io.to(sessionId).emit('initiative:update', order);
  });
});

const port = process.env.PORT || 3001;
server.listen(port, () => console.log(`Server listening on ${port}`));

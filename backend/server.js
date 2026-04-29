const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io setup for real-time notifications
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Store connected users: userId -> socketId
const connectedUsers = {};

io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);

  socket.on('register', (userId) => {
    connectedUsers[userId] = socket.id;
    console.log(`👤 User ${userId} registered on socket`);
  });

  socket.on('disconnect', () => {
    for (const [userId, sid] of Object.entries(connectedUsers)) {
      if (sid === socket.id) {
        delete connectedUsers[userId];
        break;
      }
    }
  });
});

// Make io accessible in controllers via req.app.get('io')
app.set('io', io);
app.set('connectedUsers', connectedUsers);

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/facilities', require('./routes/facility'));
app.use('/api/waste', require('./routes/waste'));
app.use('/api/recycler', require('./routes/recycler'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'EcoRecycle API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 EcoRecycle server running on http://localhost:${PORT}`);
});
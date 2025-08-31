import express from 'express';
import sequelize from './models/index.js';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';
import authRoutes from './routes/auth.js';
import challengesRoutes from './routes/challenges.js';
import messagesRoutes from './routes/messages.js';
import usersRoutes from './routes/users.js';
import scoreboardRoutes from './routes/scoreboard.js';
import {
  securityHeaders,
  generalLimiter,
  sanitizeInput,
  corsOptions
} from './middleware/security.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions
});

// Security middleware
app.use(securityHeaders);
app.use(generalLimiter);
app.use(sanitizeInput);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Limit payload size

// MySQL connection and sync
sequelize.sync({ force: false }).then(() => {
  console.log('MySQL database synchronized');
}).catch((err) => {
  console.error('MySQL sync error:', err);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/scoreboard', scoreboardRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Money Heist CTF Backend is running');
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });

  // Join scoreboard room
  socket.on('join-scoreboard', (data) => {
    socket.join('scoreboard');
    console.log(`User ${socket.id} joined scoreboard room`);
  });

  // Leave scoreboard room
  socket.on('leave-scoreboard', () => {
    socket.leave('scoreboard');
    console.log(`User ${socket.id} left scoreboard room`);
  });

  // Join specific wave room
  socket.on('join-wave', (wave) => {
    if (['red', 'blue', 'purple'].includes(wave)) {
      socket.join(`wave-${wave}`);
      console.log(`User ${socket.id} joined wave-${wave} room`);
    }
  });

  // Leave specific wave room
  socket.on('leave-wave', (wave) => {
    if (['red', 'blue', 'purple'].includes(wave)) {
      socket.leave(`wave-${wave}`);
      console.log(`User ${socket.id} left wave-${wave} room`);
    }
  });
});

// Function to emit scoreboard updates
export const emitScoreboardUpdate = (wave = null) => {
  // Emit to overall scoreboard room
  io.to('scoreboard').emit('scoreboard-update', {
    type: 'overall',
    timestamp: new Date()
  });

  // Emit to specific wave room if wave is provided
  if (wave && ['red', 'blue', 'purple'].includes(wave)) {
    io.to(`wave-${wave}`).emit('scoreboard-update', {
      type: 'wave',
      wave,
      timestamp: new Date()
    });
  }
};

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

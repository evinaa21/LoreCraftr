const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const userRoutes = require('./routes/users');
const roomRoutes = require('./routes/rooms');
const storyRoutes = require('./routes/stories');
const Room = require('./models/Room');
const GameState = require('./models/GameState');
const Origin = require('./models/Origin');
const Prompt = require('./models/Prompt');

const app = express();
const server = http.createServer(app);

// Production-ready CORS configuration
const allowedOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',')
  : ['http://localhost:3000'];

const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

const JWT_SECRET = process.env.JWT_SECRET || 'lorecraftr-secret-key';
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lorecraftr';

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Trust proxy for deployment platforms
app.set('trust proxy', 1);

// Store active game states and room sockets
const gameStates = new Map();
const roomSockets = new Map();

// MongoDB Connection with retry logic
const connectDB = async (retries = 5) => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✓ MongoDB connected successfully');
  } catch (err) {
    console.error(`✗ MongoDB connection error (${retries} retries left):`, err.message);
    
    if (retries > 0) {
      console.log('  Retrying in 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB(retries - 1);
    } else {
      console.error('✗ Failed to connect to MongoDB after multiple retries');
      process.exit(1);
    }
  }
};

connectDB();

// Mongoose connection event handlers
mongoose.connection.on('connected', () => {
  console.log('✓ Mongoose connected to MongoDB');
});

mongoose.connection.on('disconnected', () => {
  console.log('✗ Mongoose disconnected from MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('✗ Mongoose connection error:', err);
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/stories', storyRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    activeRooms: roomSockets.size,
    activeGames: gameStates.size,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Socket.IO Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    console.error('Socket connection without token');
    return next(new Error('Authentication required'));
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.userId;
    socket.username = decoded.username;
    console.log('✓ Socket authenticated:', decoded.username);
    next();
  } catch (err) {
    console.error('Socket auth failed:', err.message);
    next(new Error('Invalid token'));
  }
});

// Socket.IO Event Handlers
io.on('connection', (socket) => {
  console.log(`✓ User connected: ${socket.username} (${socket.id})`);

  // Join room
  socket.on('joinRoom', async ({ roomId }) => {
    try {
      // Leave any previous rooms
      if (socket.currentRoomId) {
        socket.leave(socket.currentRoomId);
        removeFromRoomSockets(socket.currentRoomId, socket.id);
      }

      // Join new room
      socket.join(roomId);
      socket.currentRoomId = roomId;
      addToRoomSockets(roomId, socket.id);
      
      // Get updated room data
      const room = await Room.findById(roomId).populate('players host');
      
      console.log(`  ${socket.username} joined room ${roomId}`);
      
      // Notify everyone in room
      io.to(roomId).emit('playerJoined', { 
        userId: socket.userId, 
        username: socket.username,
        room: room
      });

      // Send room state to joiner
      socket.emit('roomState', { room });
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Leave room
  socket.on('leaveRoom', async ({ roomId }) => {
    try {
      socket.leave(roomId);
      removeFromRoomSockets(roomId, socket.id);
      socket.currentRoomId = null;
      
      console.log(`  ${socket.username} left room ${roomId}`);
      
      // Notify others
      io.to(roomId).emit('playerLeft', { 
        userId: socket.userId, 
        username: socket.username 
      });

      // Check if room is empty
      const room = await Room.findById(roomId);
      if (room && !roomSockets.has(roomId)) {
        console.log(`  Cleaning up empty room ${roomId}`);
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });

  // Theme changed
  socket.on('themeChanged', async ({ roomId, theme }) => {
    try {
      const room = await Room.findById(roomId).populate('players host');
      
      // Broadcast to all in room
      io.to(roomId).emit('themeUpdated', { 
        theme,
        room 
      });
      
      console.log(`  Theme changed to ${theme} in room ${roomId}`);
    } catch (error) {
      console.error('Error changing theme:', error);
    }
  });

  // Start game
  socket.on('startGame', async ({ roomId, players }) => {
    try {
      console.log(`🎮 Starting game in room ${roomId}...`);
      
      // Get room to fetch theme
      const room = await Room.findById(roomId);
      if (!room) {
        console.error(`❌ Room not found: ${roomId}`);
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      console.log(`  Theme: ${room.theme}`);
      console.log(`  Players: ${players.length}`);

      // Fetch story origin for the theme
      const originCount = await Origin.countDocuments({ theme: room.theme });
      console.log(`  Origins available: ${originCount}`);
      
      if (originCount === 0) {
        console.error(`❌ No origins found for theme: ${room.theme}`);
        socket.emit('error', { message: 'No story origins available for this theme' });
        return;
      }
      
      const randomOrigin = Math.floor(Math.random() * originCount);
      const origin = await Origin.findOne({ theme: room.theme }).skip(randomOrigin);
      console.log(`  ✓ Selected origin: "${origin.title}"`);

      // Fetch initial prompt for SETTING phase
      const promptCount = await Prompt.countDocuments({ theme: room.theme, category: 'SETTING' });
      console.log(`  SETTING prompts available: ${promptCount}`);
      
      if (promptCount === 0) {
        console.error(`❌ No SETTING prompts found for theme: ${room.theme}`);
        socket.emit('error', { message: 'No prompts available for this theme' });
        return;
      }
      
      const randomPrompt = Math.floor(Math.random() * promptCount);
      const prompt = await Prompt.findOne({ theme: room.theme, category: 'SETTING' }).skip(randomPrompt);
      console.log(`  ✓ Selected prompt: "${prompt.text}"`);

      const gameState = new GameState(roomId, players);
      gameStates.set(roomId, gameState);
      console.log(`  ✓ Game state created`);

      const gameData = {
        currentRound: gameState.currentRound,
        phase: gameState.getPhase(),
        scribeId: gameState.scribeId,
        maxRounds: gameState.maxRounds,
        theme: room.theme,
        origin: origin,
        prompt: prompt,
        narrative: []
      };

      io.to(roomId).emit('gameStarted', gameData);
      console.log(`✓ Game started - emitted gameStarted to room ${roomId}`);
      console.log(`  Data:`, { 
        round: gameData.currentRound, 
        phase: gameData.phase, 
        scribeId: gameData.scribeId,
        hasOrigin: !!gameData.origin,
        hasPrompt: !!gameData.prompt
      });
    } catch (error) {
      console.error('❌ Error starting game:', error);
      socket.emit('error', { message: 'Failed to start game: ' + error.message });
    }
  });

  // Submit sentence
  socket.on('submitSentence', ({ roomId, sentence, playerId, playerName }) => {
    const gameState = gameStates.get(roomId);
    if (!gameState) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    try {
      // Use provided playerId and playerName, fallback to socket info
      const userId = playerId || socket.userId;
      const username = playerName || socket.username;
      
      gameState.addSubmission(userId, sentence, username);
      
      io.to(roomId).emit('submissionReceived', {
        playerId: userId,
        playerName: username,
        totalSubmissions: gameState.submissions.size,
        requiredSubmissions: gameState.players.length - 1
      });

      if (gameState.allSubmitted()) {
        // Move to voting phase
        const submissions = Array.from(gameState.submissions.values());
        io.to(roomId).emit('votingPhase', { submissions });
      }
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  // Submit vote
  socket.on('submitVote', ({ roomId, submissionId }) => {
    const gameState = gameStates.get(roomId);
    if (!gameState) return;

    try {
      gameState.addVote(socket.userId, submissionId);
      
      io.to(roomId).emit('voteReceived', {
        voterId: socket.userId,
        totalVotes: gameState.votes.size,
        requiredVotes: gameState.players.length - 1
      });

      if (gameState.allVoted()) {
        const topVoted = gameState.calculateTopVoted();
        io.to(roomId).emit('scribeChoice', { 
          topVoted,
          scribeId: gameState.scribeId 
        });
      }
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  // Scribe choice
  socket.on('scribeChoice', async ({ roomId, chosenId, scribeTag }) => {
    const gameState = gameStates.get(roomId);
    if (!gameState) return;

    if (socket.userId !== gameState.scribeId) {
      socket.emit('error', { message: 'Only the scribe can make this choice' });
      return;
    }

    const chosen = gameState.submissions.get(chosenId);
    if (!chosen) {
      socket.emit('error', { message: 'Invalid submission' });
      return;
    }

    const voteTally = gameState.topVoted;

    io.to(roomId).emit('roundComplete', {
      chosenSentence: chosen.sentence,
      scribeTag,
      voteTally,
      authorId: chosenId,
      authorName: chosen.playerName,
      round: gameState.currentRound
    });

    gameState.nextRound();

    if (gameState.isComplete()) {
      io.to(roomId).emit('gameComplete');
      gameStates.delete(roomId);
      console.log(`✓ Game completed in room ${roomId}`);
    } else {
      // Fetch new prompt for the current phase
      const room = await Room.findById(roomId);
      const phase = gameState.getPhase();
      
      const promptCount = await Prompt.countDocuments({ theme: room.theme, category: phase });
      const randomPrompt = Math.floor(Math.random() * promptCount);
      const prompt = await Prompt.findOne({ theme: room.theme, category: phase }).skip(randomPrompt);
      
      io.to(roomId).emit('nextRound', {
        currentRound: gameState.currentRound,
        phase: gameState.getPhase(),
        scribeId: gameState.scribeId,
        prompt: prompt
      });
    }
  });

  // Disconnect
  socket.on('disconnect', async () => {
    console.log(`✗ User disconnected: ${socket.username}`);
    
    if (socket.currentRoomId) {
      removeFromRoomSockets(socket.currentRoomId, socket.id);
      
      io.to(socket.currentRoomId).emit('playerLeft', { 
        userId: socket.userId, 
        username: socket.username 
      });
    }
  });
});

// Helper functions for room socket management
function addToRoomSockets(roomId, socketId) {
  if (!roomSockets.has(roomId)) {
    roomSockets.set(roomId, new Set());
  }
  roomSockets.get(roomId).add(socketId);
}

function removeFromRoomSockets(roomId, socketId) {
  if (roomSockets.has(roomId)) {
    roomSockets.get(roomId).delete(socketId);
    if (roomSockets.get(roomId).size === 0) {
      roomSockets.delete(roomId);
    }
  }
}

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  if (fs.existsSync(path.join(__dirname, 'WELCOME.txt'))) {
    console.log('\n' + fs.readFileSync(path.join(__dirname, 'WELCOME.txt'), 'utf8'));
  }
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health\n`);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} signal received: closing HTTP server`);
  
  server.close(async () => {
    console.log('HTTP server closed');
    
    // Close all socket connections
    io.close(() => {
      console.log('Socket.IO connections closed');
    });
    
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
    process.exit(0);
  });
  
  // Force close after 30s
  setTimeout(() => {
    console.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

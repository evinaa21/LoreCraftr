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
const promptCache = new Map(); // Cache prompts by theme+category
const originCache = new Map(); // Cache origins by theme

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

async function getCachedPrompt(theme, category) {
  const key = `${theme}-${category}`;
  
  if (promptCache.has(key)) {
    const cached = promptCache.get(key);
    return cached[Math.floor(Math.random() * cached.length)];
  }
  
  const prompts = await Prompt.find({ theme, category }).lean();
  if (prompts.length === 0) return null;
  
  promptCache.set(key, prompts);
  return prompts[Math.floor(Math.random() * prompts.length)];
}

async function getCachedOrigin(theme) {
  if (originCache.has(theme)) {
    const cached = originCache.get(theme);
    return cached[Math.floor(Math.random() * cached.length)];
  }
  
  const origins = await Origin.find({ theme }).lean();
  if (origins.length === 0) return null;
  
  originCache.set(theme, origins);
  return origins[Math.floor(Math.random() * origins.length)];
}

// Pre-cache prompts and origins on startup
mongoose.connection.once('open', async () => {
  console.log('✓ Pre-caching game content...');
  
  try {
    const themes = ['Gritty Sci-Fi', 'High Fantasy', 'Weird West', 'Cyberpunk Noir', 'Cosmic Horror'];
    const categories = ['SETTING', 'ACTION', 'CONSEQUENCE'];
    
    // Cache all prompts
    for (const theme of themes) {
      for (const category of categories) {
        const prompts = await Prompt.find({ theme, category }).lean();
        promptCache.set(`${theme}-${category}`, prompts);
      }
      
      // Cache all origins
      const origins = await Origin.find({ theme }).lean();
      originCache.set(theme, origins);
    }
    
    console.log(`✓ Cached ${promptCache.size} prompt sets and ${originCache.size} origin sets`);
  } catch (error) {
    console.error('⚠ Warning: Could not pre-cache content:', error.message);
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

      // If a game is already active, send current game state to the joiner
      const activeGame = gameStates.get(roomId);
      if (activeGame) {
        console.log(`  Sending active game state to ${socket.username} in room ${roomId}`);
        socket.emit('gameStarted', activeGame.getPublicState());
      }
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
      console.log(`\n🎮 ========== GAME START REQUEST ==========`);
      console.log(`  Room ID: ${roomId}`);
      console.log(`  Socket ID: ${socket.id}`);
      console.log(`  User: ${socket.username}`);
      console.log(`  Players count: ${players.length}`);
      console.log(`  Socket rooms: ${Array.from(socket.rooms).join(', ')}`);
      console.log(`  Room has sockets: ${roomSockets.has(roomId)}`);
      console.log(`  Room socket count: ${roomSockets.get(roomId)?.size || 0}`);
      console.log(`==========================================\n`);
      
      const room = await Room.findById(roomId).lean();
      if (!room) {
        console.error(`❌ Room not found: ${roomId}`);
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      console.log(`  Theme: ${room.theme}, Players: ${players.length}`);

      // Use cached queries with timeout
      const [origin, prompt] = await Promise.race([
        Promise.all([
          getCachedOrigin(room.theme),
          getCachedPrompt(room.theme, 'SETTING')
        ]),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 5000)
        )
      ]);

      if (!origin || !prompt) {
        console.error(`❌ Missing content for theme: ${room.theme}`);
        socket.emit('error', { 
          message: `Content not available for ${room.theme}. Please try another theme.` 
        });
        return;
      }

      console.log(`  ✓ Selected origin: "${origin.title}"`);
      console.log(`  ✓ Selected prompt: "${prompt.text}"`);

      const gameState = new GameState(roomId, players);
      // Persist game metadata for late joiners
      gameState.theme = room.theme;
      gameState.origin = { title: origin.title, text: origin.text };
      gameState.prompt = { text: prompt.text, category: prompt.category };
      gameState.narrative = [];

      gameStates.set(roomId, gameState);
      
      const gameData = gameState.getPublicState();

      console.log(`📡 Emitting gameStarted to room ${roomId}...`);
      console.log(`  Sockets in room:`, Array.from(io.sockets.adapter.rooms.get(roomId) || []));
      console.log(`  Game data:`, JSON.stringify(gameData, null, 2));

      // Emit to ALL clients in the room
      io.to(roomId).emit('gameStarted', gameData);
      
      console.log(`✅ gameStarted emitted successfully\n`);
      
    } catch (error) {
      console.error('❌ Error starting game:', error.message);
      console.error('Stack:', error.stack);
      socket.emit('error', { 
        message: 'Failed to start game. Please try again.' 
      });
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
        // All submissions received - scribe chooses directly
        const submissions = gameState.getAllSubmissions();
        io.to(roomId).emit('scribeChoice', { 
          submissions,
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
    if (!gameState) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    if (socket.userId !== gameState.scribeId) {
      socket.emit('error', { message: 'Only the scribe can finalize the round' });
      return;
    }

    const chosen = gameState.submissions.get(chosenId);
    if (!chosen) {
      socket.emit('error', { message: 'Chosen submission not found' });
      return;
    }

    // Persist into narrative so late joiners can catch up
    gameState.addNarrativeEntry(chosen.sentence, scribeTag);

    io.to(roomId).emit('roundComplete', {
      chosenSentence: chosen.sentence,
      scribeTag,
      authorId: chosenId,
      authorName: chosen.playerName,
      round: gameState.currentRound
    });

    gameState.nextRound();

    if (gameState.isComplete()) {
      io.to(roomId).emit('gameComplete');
      gameStates.delete(roomId);
    } else {
      io.to(roomId).emit('nextRound', {
        currentRound: gameState.currentRound,
        phase: gameState.getPhase(),
        scribeId: gameState.scribeId
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

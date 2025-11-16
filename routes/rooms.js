const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { requireAuth } = require('../middleware/auth');

// Generate unique room code
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new room
router.post('/create', requireAuth, async (req, res) => {
  const { name, theme, maxPlayers } = req.body;
  
  try {
    // Validate input
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    if (name.length > 50) {
      return res.status(400).json({ error: 'Room name too long (max 50 characters)' });
    }

    const validThemes = ['Gritty Sci-Fi', 'High Fantasy', 'Weird West', 'Cyberpunk Noir', 'Cosmic Horror'];
    if (theme && !validThemes.includes(theme)) {
      return res.status(400).json({ error: 'Invalid theme' });
    }

    if (maxPlayers && (maxPlayers < 2 || maxPlayers > 4)) {
      return res.status(400).json({ error: 'Max players must be between 2 and 4' });
    }

    // Generate unique code
    let code;
    let codeExists = true;
    let attempts = 0;
    
    while (codeExists && attempts < 10) {
      code = generateRoomCode();
      const existing = await Room.findOne({ code });
      codeExists = !!existing;
      attempts++;
    }

    if (codeExists) {
      return res.status(500).json({ error: 'Failed to generate unique room code' });
    }

    const room = new Room({
      name: name.trim(),
      code,
      theme: theme || 'Gritty Sci-Fi',
      maxPlayers: maxPlayers || 4,
      host: req.user._id,
      players: [req.user._id],
      status: 'WAITING',
      locked: false
    });
    
    await room.save();
    await room.populate('players host');
    
    console.log(`✓ Room created: ${room.name} (${room.code}) by ${req.user.username}`);
    res.status(201).json(room);
  } catch (error) {
    console.error('Create room error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get all available rooms
router.get('/available', async (req, res) => {
  try {
    const rooms = await Room.find({ 
      status: 'WAITING',
      locked: false,
      $expr: { $lt: [{ $size: "$players" }, "$maxPlayers"] } // Not full
    })
    .populate('players host')
    .sort({ createdAt: -1 })
    .limit(20);
    
    res.json(rooms);
  } catch (error) {
    console.error('Get available rooms error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get room by ID
router.get('/:roomId', async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId)
      .populate('players host');
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    res.json(room);
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Room not found' });
  }
});

// Get room by code
router.get('/code/:code', async (req, res) => {
  try {
    const room = await Room.findOne({ 
      code: req.params.code.toUpperCase() 
    }).populate('players host');
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found with that code' });
    }
    
    res.json(room);
  } catch (error) {
    console.error('Get room by code error:', error);
    res.status(500).json({ error: 'Room not found' });
  }
});

// Join room
router.post('/join/:roomId', requireAuth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.status !== 'WAITING') {
      return res.status(403).json({ error: 'Game already in progress' });
    }
    
    if (room.locked) {
      return res.status(403).json({ error: 'Room is locked' });
    }
    
    if (room.players.length >= room.maxPlayers) {
      return res.status(403).json({ error: 'Room is full' });
    }
    
    // Check if already in room
    const alreadyJoined = room.players.some(p => p.equals(req.user._id));
    
    if (alreadyJoined) {
      await room.populate('players host');
      console.log(`  ${req.user.username} already in room ${room.code}`);
      return res.json(room);
    }
    
    room.players.push(req.user._id);
    await room.save();
    await room.populate('players host');
    
    console.log(`✓ ${req.user.username} joined room ${room.code} (${room.players.length}/${room.maxPlayers})`);
    res.json(room);
  } catch (error) {
    console.error('Join room error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Join by code
router.post('/join-code/:code', requireAuth, async (req, res) => {
  try {
    const room = await Room.findOne({ 
      code: req.params.code.toUpperCase() 
    });
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found with that code' });
    }

    if (room.status !== 'WAITING') {
      return res.status(403).json({ error: 'Game already in progress' });
    }
    
    if (room.locked) {
      return res.status(403).json({ error: 'Room is locked' });
    }
    
    if (room.players.length >= room.maxPlayers) {
      return res.status(403).json({ error: 'Room is full' });
    }
    
    const alreadyJoined = room.players.some(p => p.equals(req.user._id));
    
    if (!alreadyJoined) {
      room.players.push(req.user._id);
      await room.save();
    }
    
    await room.populate('players host');
    
    console.log(`✓ ${req.user.username} joined room ${room.code} via code`);
    res.json(room);
  } catch (error) {
    console.error('Join by code error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Leave room
router.post('/leave/:roomId', requireAuth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    const initialPlayerCount = room.players.length;
    room.players = room.players.filter(p => !p.equals(req.user._id));
    
    // Delete room if empty
    if (room.players.length === 0) {
      await Room.findByIdAndDelete(req.params.roomId);
      console.log(`✓ Room ${room.code} deleted (empty)`);
      return res.json({ message: 'Room deleted', deleted: true });
    }
    
    // Reassign host if needed
    if (room.host.equals(req.user._id)) {
      room.host = room.players[0];
      console.log(`  Host reassigned to ${room.players[0]}`);
    }
    
    await room.save();
    await room.populate('players host');
    
    console.log(`✓ ${req.user.username} left room ${room.code} (${room.players.length}/${room.maxPlayers})`);
    res.json(room);
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Set theme
router.patch('/theme/:roomId', requireAuth, async (req, res) => {
  const { theme } = req.body;
  
  try {
    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    if (!room.host.equals(req.user._id)) {
      return res.status(403).json({ error: 'Only host can change theme' });
    }
    
    const validThemes = ['Gritty Sci-Fi', 'High Fantasy', 'Weird West', 'Cyberpunk Noir', 'Cosmic Horror'];
    if (!validThemes.includes(theme)) {
      return res.status(400).json({ error: 'Invalid theme' });
    }
    
    room.theme = theme;
    await room.save();
    await room.populate('players host');
    
    console.log(`✓ Room ${room.code} theme changed to ${theme}`);
    res.json(room);
  } catch (error) {
    console.error('Change theme error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Lock/unlock room
router.patch('/lock/:roomId', requireAuth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    if (!room.host.equals(req.user._id)) {
      return res.status(403).json({ error: 'Only host can lock room' });
    }
    
    room.locked = !room.locked;
    await room.save();
    await room.populate('players host');
    
    console.log(`✓ Room ${room.code} ${room.locked ? 'locked' : 'unlocked'}`);
    res.json(room);
  } catch (error) {
    console.error('Lock room error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Start game
router.post('/start/:roomId', requireAuth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId).populate('players');
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    if (!room.host.equals(req.user._id)) {
      return res.status(403).json({ error: 'Only host can start game' });
    }
    
    if (room.players.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 players to start' });
    }
    
    if (room.players.length > 4) {
      return res.status(400).json({ error: 'Too many players (max 4)' });
    }
    
    room.status = 'IN_PROGRESS';
    room.locked = true;
    await room.save();
    await room.populate('players host');
    
    console.log(`✓ Game started in room ${room.code}`);
    res.json(room);
  } catch (error) {
    console.error('Start game error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete room
router.delete('/:roomId', requireAuth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    if (!room.host.equals(req.user._id)) {
      return res.status(403).json({ error: 'Only host can delete room' });
    }
    
    await Room.findByIdAndDelete(req.params.roomId);
    console.log(`✓ Room ${room.code} deleted by host`);
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

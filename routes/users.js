const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Story = require('../models/Story');
const jwt = require('jsonwebtoken');
const { requireAuth } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'lorecraftr-secret-key';

// Register
router.post('/register', async (req, res) => {
  const { username, email, password, initials } = req.body;
  
  try {
    // Validate input
    if (!username || username.length < 3 || username.length > 20) {
      return res.status(400).json({ 
        error: 'Username must be 3-20 characters' 
      });
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        error: 'Valid email required' 
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters' 
      });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        error: existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken'
      });
    }
    
    const user = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      initials: initials?.toUpperCase() || username.substring(0, 2).toUpperCase()
    });
    
    await user.save();
    
    // Create token with userId AND username
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        username: user.username 
      }, 
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('✓ User registered:', user.username);
    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    console.log('Login attempt for:', username);
    
    const user = await User.findOne({ 
      $or: [
        { username: username.trim() }, 
        { email: username.toLowerCase().trim() }
      ] 
    });
    
    if (!user) {
      console.log('✗ User not found:', username);
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      console.log('✗ Invalid password for:', username);
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Create token with userId AND username
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        username: user.username 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('✓ User logged in:', user.username);
    res.json({ user, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Check session
router.get('/check-session', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

// Get user profile
router.get('/profile/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile
router.patch('/profile', requireAuth, async (req, res) => {
  const { initials, email } = req.body;
  
  try {
    if (initials) {
      if (initials.length !== 2) {
        return res.status(400).json({ error: 'Initials must be 2 characters' });
      }
      req.user.initials = initials.toUpperCase();
    }
    
    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (existing) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      req.user.email = email.toLowerCase().trim();
    }
    
    await req.user.save();
    res.json(req.user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update password
router.patch('/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  try {
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const isMatch = await req.user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    req.user.password = newPassword;
    await req.user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user's stories
router.get('/stories', requireAuth, async (req, res) => {
  try {
    const stories = await Story.find({ 
      players: req.user._id 
    }).populate('players').sort({ updatedAt: -1 });
    
    res.json(stories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete account
router.delete('/delete', requireAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

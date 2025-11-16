const express = require('express');
const router = express.Router();
const Story = require('../models/Story');
const Prompt = require('../models/Prompt');
const Origin = require('../models/Origin');
const { calculateScores } = require('../utils/scoring');

// Get all origins for a theme
router.get('/theme/:theme/origins', async (req, res) => {
  try {
    const origins = await Origin.find({ 
      theme: req.params.theme
    });
    res.json(origins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get random origin for a theme
router.get('/theme/:theme/origins/random', async (req, res) => {
  try {
    const count = await Origin.countDocuments({ theme: req.params.theme });
    const random = Math.floor(Math.random() * count);
    const origin = await Origin.findOne({ theme: req.params.theme }).skip(random);
    res.json(origin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get prompts for theme and category
router.get('/theme/:theme/prompts/:category', async (req, res) => {
  try {
    const prompts = await Prompt.find({ 
      theme: req.params.theme,
      category: req.params.category
    });
    res.json(prompts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get random prompt for theme and category
router.get('/theme/:theme/prompts/:category/random', async (req, res) => {
  try {
    const count = await Prompt.countDocuments({ 
      theme: req.params.theme,
      category: req.params.category
    });
    const random = Math.floor(Math.random() * count);
    const prompt = await Prompt.findOne({ 
      theme: req.params.theme,
      category: req.params.category
    }).skip(random);
    res.json(prompt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new prompt
router.post('/prompt/:theme', async (req, res) => {
  const { category, text } = req.body;
  
  try {
    const prompt = new Prompt({
      theme: req.params.theme,
      category,
      text
    });
    await prompt.save();
    res.status(201).json(prompt);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create new story
router.post('/create', async (req, res) => {
  const { theme, origin, players } = req.body;
  
  try {
    const story = new Story({
      theme,
      origin,
      players,
      narrative: [],
      currentRound: 1,
      scores: new Map(players.map(p => [p, 0])),
      status: 'IN_PROGRESS'
    });
    
    await story.save();
    res.status(201).json(story);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get story by ID
router.get('/:storyId', async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId).populate('players');
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }
    res.json(story);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add contribution to story
router.post('/contribute/:storyId', async (req, res) => {
  const { chosenSentence, scribeTag, voteTally, scribeId } = req.body;
  
  try {
    const story = await Story.findById(req.params.storyId);
    
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    if (story.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Story is already completed' });
    }
    
    // Combine chosen sentence with scribe tag
    const fullText = scribeTag ? `${chosenSentence} ${scribeTag}` : chosenSentence;
    
    story.narrative.push({
      text: fullText,
      round: story.currentRound,
      voteTally,
      scribeId
    });
    
    // Calculate and update scores
    const scores = calculateScores(voteTally, chosenSentence.authorId, scribeId);
    Object.entries(scores).forEach(([playerId, points]) => {
      const currentScore = story.scores.get(playerId) || 0;
      story.scores.set(playerId, currentScore + points);
    });
    
    story.currentRound++;
    
    // Mark as completed if we've reached max rounds
    if (story.currentRound > 15) {
      story.status = 'COMPLETED';
    }
    
    await story.save();
    res.json(story);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user's stories
router.get('/user/:userId', async (req, res) => {
  try {
    const stories = await Story.find({ 
      players: req.params.userId 
    }).populate('players').sort({ updatedAt: -1 });
    res.json(stories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete story
router.delete('/:storyId', async (req, res) => {
  try {
    const story = await Story.findByIdAndDelete(req.params.storyId);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }
    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
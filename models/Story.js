const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  theme: { 
    type: String, 
    required: true 
  },
  origin: {
    type: String,
    required: true
  },
  narrative: [{
    text: String,
    round: Number,
    voteTally: [{
      authorId: mongoose.Schema.Types.ObjectId,
      votes: Number
    }],
    scribeId: mongoose.Schema.Types.ObjectId,
    timestamp: { type: Date, default: Date.now }
  }],
  currentRound: {
    type: Number,
    default: 1,
    max: 15
  },
  scores: {
    type: Map,
    of: Number
  },
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    min: 2,
    max: 4
  }],
  status: {
    type: String,
    enum: ['IN_PROGRESS', 'COMPLETED'],
    default: 'IN_PROGRESS'
  }
});

module.exports = mongoose.model('Story', storySchema);
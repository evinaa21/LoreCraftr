const mongoose = require('mongoose');

const promptSchema = new mongoose.Schema({
  theme: {
    type: String,
    required: true,
    enum: ['Gritty Sci-Fi', 'High Fantasy', 'Weird West', 'Cyberpunk Noir', 'Cosmic Horror']
  },
  category: {
    type: String,
    required: true,
    enum: ['SETTING', 'ACTION', 'CONSEQUENCE']
  },
  text: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 200
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries
promptSchema.index({ theme: 1, category: 1 });

module.exports = mongoose.model('Prompt', promptSchema);

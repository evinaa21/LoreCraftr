const mongoose = require('mongoose');

const originSchema = new mongoose.Schema({
  theme: {
    type: String,
    required: true,
    enum: ['Gritty Sci-Fi', 'High Fantasy', 'Weird West', 'Cyberpunk Noir', 'Cosmic Horror']
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  text: {
    type: String,
    required: true,
    minlength: 20,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

originSchema.index({ theme: 1 });

module.exports = mongoose.model('Origin', originSchema);

require('dotenv').config();
const mongoose = require('mongoose');
const Origin = require('../models/Origin');
const Prompt = require('../models/Prompt');

const origins = [
  {
    theme: 'Gritty Sci-Fi',
    title: 'The Year 3045',
    text: 'Earth is a wasteland. Humanity clings to existence in massive orbital stations, watching their home planet die below them.'
  },
  {
    theme: 'Gritty Sci-Fi',
    title: 'The Last Colony',
    text: 'Communication with Earth ceased three years ago. The Mars colony must decide: risk everything to return, or forge a new future among the red dunes.'
  },
  {
    theme: 'High Fantasy',
    title: 'The Citadel of K\'tharr',
    text: 'For a thousand years, the crystal towers have stood. Now, the stones whisper of change, and ancient magic stirs beneath the foundations.'
  },
  {
    theme: 'High Fantasy',
    title: 'The Broken Covenant',
    text: 'When the last dragon fell, the old magic began to fade. The elders say the world will follow, unless the covenant is renewed.'
  },
  {
    theme: 'Weird West',
    title: 'Dust Devil Territory',
    text: 'They say the railroad won\'t cross these lands. Not because of the outlaws, but because of what lives in the canyons after sundown.'
  },
  {
    theme: 'Weird West',
    title: 'The Silver Creek Incident',
    text: 'The whole town vanished overnight. When the marshal arrived, he found only empty buildings and strange symbols carved into every doorframe.'
  },
  {
    theme: 'Cyberpunk Noir',
    title: 'Neon District 7',
    text: 'In the shadow of corporate megastructures, where the rain never stops and memories can be bought and sold, a detective hunts for truth.'
  },
  {
    theme: 'Cyberpunk Noir',
    title: 'The Memory Heist',
    text: 'Someone is stealing decades from people\'s minds. The victims wake up believing it\'s still 2040, unaware that twenty years have passed.'
  },
  {
    theme: 'Cosmic Horror',
    title: 'The Lighthouse Signal',
    text: 'The abandoned lighthouse began transmitting again. The signal isn\'t human, and those who hear it speak of a place beyond the stars.'
  },
  {
    theme: 'Cosmic Horror',
    title: 'Expedition 13',
    text: 'The deep-sea research station found something in the trench. Now the crew reports seeing shapes in the darkness, and the structure itself is changing.'
  }
];

const prompts = [
  // Gritty Sci-Fi - SETTING
  { theme: 'Gritty Sci-Fi', category: 'SETTING', text: 'Describe the air quality in this environment.' },
  { theme: 'Gritty Sci-Fi', category: 'SETTING', text: 'What do the inhabitants eat to survive?' },
  { theme: 'Gritty Sci-Fi', category: 'SETTING', text: 'Detail the most common form of transportation.' },
  { theme: 'Gritty Sci-Fi', category: 'SETTING', text: 'Describe the social hierarchy of this place.' },
  { theme: 'Gritty Sci-Fi', category: 'SETTING', text: 'What technology defines daily life here?' },
  
  // Gritty Sci-Fi - ACTION
  { theme: 'Gritty Sci-Fi', category: 'ACTION', text: 'A system failure threatens everyone nearby.' },
  { theme: 'Gritty Sci-Fi', category: 'ACTION', text: 'Someone discovers a forbidden piece of technology.' },
  { theme: 'Gritty Sci-Fi', category: 'ACTION', text: 'An authority figure arrives unexpectedly.' },
  { theme: 'Gritty Sci-Fi', category: 'ACTION', text: 'A desperate deal is proposed.' },
  { theme: 'Gritty Sci-Fi', category: 'ACTION', text: 'The power grid goes dark.' },
  
  // Gritty Sci-Fi - CONSEQUENCE
  { theme: 'Gritty Sci-Fi', category: 'CONSEQUENCE', text: 'Describe what was lost forever.' },
  { theme: 'Gritty Sci-Fi', category: 'CONSEQUENCE', text: 'Who pays the price for survival?' },
  { theme: 'Gritty Sci-Fi', category: 'CONSEQUENCE', text: 'What new danger emerges?' },
  { theme: 'Gritty Sci-Fi', category: 'CONSEQUENCE', text: 'How does society adapt to this change?' },
  { theme: 'Gritty Sci-Fi', category: 'CONSEQUENCE', text: 'What truth can no longer be hidden?' },
  
  // High Fantasy - SETTING
  { theme: 'High Fantasy', category: 'SETTING', text: 'Describe the oldest structure in this realm.' },
  { theme: 'High Fantasy', category: 'SETTING', text: 'What magical force permeates this place?' },
  { theme: 'High Fantasy', category: 'SETTING', text: 'Detail the most powerful faction here.' },
  { theme: 'High Fantasy', category: 'SETTING', text: 'Describe the natural laws that govern this land.' },
  { theme: 'High Fantasy', category: 'SETTING', text: 'What ancient oath binds the people?' },
  
  // High Fantasy - ACTION
  { theme: 'High Fantasy', category: 'ACTION', text: 'A prophecy begins to manifest.' },
  { theme: 'High Fantasy', category: 'ACTION', text: 'An artifact awakens after centuries of slumber.' },
  { theme: 'High Fantasy', category: 'ACTION', text: 'The old magic resurfaces unexpectedly.' },
  { theme: 'High Fantasy', category: 'ACTION', text: 'A rival faction makes their move.' },
  { theme: 'High Fantasy', category: 'ACTION', text: 'The natural order is disrupted.' },
  
  // High Fantasy - CONSEQUENCE
  { theme: 'High Fantasy', category: 'CONSEQUENCE', text: 'What balance has been upset?' },
  { theme: 'High Fantasy', category: 'CONSEQUENCE', text: 'Which ancient being takes notice?' },
  { theme: 'High Fantasy', category: 'CONSEQUENCE', text: 'How does magic itself respond?' },
  { theme: 'High Fantasy', category: 'CONSEQUENCE', text: 'What alliance is broken?' },
  { theme: 'High Fantasy', category: 'CONSEQUENCE', text: 'Which prophecy moves closer to fulfillment?' },
  
  // Weird West - SETTING
  { theme: 'Weird West', category: 'SETTING', text: 'Describe what lurks in the desert at night.' },
  { theme: 'Weird West', category: 'SETTING', text: 'Detail the town\'s most unusual landmark.' },
  { theme: 'Weird West', category: 'SETTING', text: 'What do the locals never speak of?' },
  { theme: 'Weird West', category: 'SETTING', text: 'Describe the source of the town\'s wealth.' },
  { theme: 'Weird West', category: 'SETTING', text: 'What supernatural force is common knowledge?' },
  
  // Weird West - ACTION
  { theme: 'Weird West', category: 'ACTION', text: 'A stranger rides in from the wastes.' },
  { theme: 'Weird West', category: 'ACTION', text: 'The dead rise with the full moon.' },
  { theme: 'Weird West', category: 'ACTION', text: 'Someone breaks the town\'s oldest taboo.' },
  { theme: 'Weird West', category: 'ACTION', text: 'A duel is called at sundown.' },
  { theme: 'Weird West', category: 'ACTION', text: 'Ancient symbols appear overnight.' },
  
  // Weird West - CONSEQUENCE
  { theme: 'Weird West', category: 'CONSEQUENCE', text: 'What curse now afflicts the land?' },
  { theme: 'Weird West', category: 'CONSEQUENCE', text: 'Who vanishes without a trace?' },
  { theme: 'Weird West', category: 'CONSEQUENCE', text: 'What boundary is no longer safe?' },
  { theme: 'Weird West', category: 'CONSEQUENCE', text: 'Which legend proves to be true?' },
  { theme: 'Weird West', category: 'CONSEQUENCE', text: 'What deal with darkness is struck?' },
  
  // Cyberpunk Noir - SETTING
  { theme: 'Cyberpunk Noir', category: 'SETTING', text: 'Describe the corporate sector that dominates.' },
  { theme: 'Cyberpunk Noir', category: 'SETTING', text: 'What illegal augmentation is most common?' },
  { theme: 'Cyberpunk Noir', category: 'SETTING', text: 'Detail the underground network.' },
  { theme: 'Cyberpunk Noir', category: 'SETTING', text: 'Describe the surveillance state.' },
  { theme: 'Cyberpunk Noir', category: 'SETTING', text: 'What data is most valuable?' },
  
  // Cyberpunk Noir - ACTION
  { theme: 'Cyberpunk Noir', category: 'ACTION', text: 'A netrunner breaches the firewall.' },
  { theme: 'Cyberpunk Noir', category: 'ACTION', text: 'Corporate security closes in.' },
  { theme: 'Cyberpunk Noir', category: 'ACTION', text: 'A memory chip changes hands.' },
  { theme: 'Cyberpunk Noir', category: 'ACTION', text: 'The AI begins acting autonomously.' },
  { theme: 'Cyberpunk Noir', category: 'ACTION', text: 'A whistleblower makes contact.' },
  
  // Cyberpunk Noir - CONSEQUENCE
  { theme: 'Cyberpunk Noir', category: 'CONSEQUENCE', text: 'What information is erased forever?' },
  { theme: 'Cyberpunk Noir', category: 'CONSEQUENCE', text: 'Who becomes a target?' },
  { theme: 'Cyberpunk Noir', category: 'CONSEQUENCE', text: 'What conspiracy is revealed?' },
  { theme: 'Cyberpunk Noir', category: 'CONSEQUENCE', text: 'Which corporation falls?' },
  { theme: 'Cyberpunk Noir', category: 'CONSEQUENCE', text: 'What freedom is lost?' },
  
  // Cosmic Horror - SETTING
  { theme: 'Cosmic Horror', category: 'SETTING', text: 'Describe the impossible geometry of this place.' },
  { theme: 'Cosmic Horror', category: 'SETTING', text: 'What sensation defies human understanding?' },
  { theme: 'Cosmic Horror', category: 'SETTING', text: 'Detail the signs of otherworldly presence.' },
  { theme: 'Cosmic Horror', category: 'SETTING', text: 'Describe what should not exist, yet does.' },
  { theme: 'Cosmic Horror', category: 'SETTING', text: 'What drives those who linger here to madness?' },
  
  // Cosmic Horror - ACTION
  { theme: 'Cosmic Horror', category: 'ACTION', text: 'Reality fractures at the edges.' },
  { theme: 'Cosmic Horror', category: 'ACTION', text: 'Something vast awakens.' },
  { theme: 'Cosmic Horror', category: 'ACTION', text: 'The stars align in wrong configurations.' },
  { theme: 'Cosmic Horror', category: 'ACTION', text: 'A mind touches the infinite.' },
  { theme: 'Cosmic Horror', category: 'ACTION', text: 'The veil between worlds thins.' },
  
  // Cosmic Horror - CONSEQUENCE
  { theme: 'Cosmic Horror', category: 'CONSEQUENCE', text: 'What truth shatters sanity?' },
  { theme: 'Cosmic Horror', category: 'CONSEQUENCE', text: 'Who transforms into something else?' },
  { theme: 'Cosmic Horror', category: 'CONSEQUENCE', text: 'What can never be forgotten?' },
  { theme: 'Cosmic Horror', category: 'CONSEQUENCE', text: 'Which door can never be closed?' },
  { theme: 'Cosmic Horror', category: 'CONSEQUENCE', text: 'What waits in the darkness beyond?' }
];

async function seedDatabase() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/lorecraftr',
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    
    console.log('✓ Connected to MongoDB');
    
    // Clear existing data
    await Origin.deleteMany({});
    await Prompt.deleteMany({});
    console.log('✓ Cleared existing data');
    
    // Insert origins
    await Origin.insertMany(origins);
    console.log(`✓ Seeded ${origins.length} origins`);
    
    // Insert prompts
    await Prompt.insertMany(prompts);
    console.log(`✓ Seeded ${prompts.length} prompts`);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Database seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();

require('dotenv').config();
const mongoose = require('mongoose');
const Prompt = require('./models/Prompt');
const Origin = require('./models/Origin');

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');
    
    const promptCount = await Prompt.countDocuments();
    const originCount = await Origin.countDocuments();
    
    console.log('Total Prompts:', promptCount);
    console.log('Total Origins:', originCount);
    console.log('\nPrompts by Theme and Category:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const themes = ['Gritty Sci-Fi', 'High Fantasy', 'Weird West', 'Cyberpunk Noir', 'Cosmic Horror'];
    
    for (const theme of themes) {
      const setting = await Prompt.countDocuments({ theme, category: 'SETTING' });
      const action = await Prompt.countDocuments({ theme, category: 'ACTION' });
      const consequence = await Prompt.countDocuments({ theme, category: 'CONSEQUENCE' });
      
      console.log(`\n${theme}:`);
      console.log(`  SETTING: ${setting}`);
      console.log(`  ACTION: ${action}`);
      console.log(`  CONSEQUENCE: ${consequence}`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (promptCount === 0) {
      console.log('\n⚠️  No prompts found! Run: npm run seed');
    }
    
    await mongoose.connection.close();
    console.log('\n✓ Done');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();

# LoreCraftr - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Install Dependencies

Make sure you have installed:
- **Node.js** (v14+): [Download here](https://nodejs.org/)
- **MongoDB** (v4.4+): [Download here](https://www.mongodb.com/try/download/community)

### 2. Start MongoDB

**Windows:**
```powershell
# Start MongoDB service
net start MongoDB

# Or if installed locally:
mongod --dbpath="C:\data\db"
```

**macOS/Linux:**
```bash
# Start MongoDB
sudo systemctl start mongod

# Or if using Homebrew:
brew services start mongodb-community
```

### 3. Install Project

```bash
# Install dependencies
npm install

# Seed database with sample data
npm run seed
```

### 4. Start Server

```bash
# Development mode (auto-restart)
npm run dev

# Production mode
npm start
```

### 5. Open Browser

Navigate to: **http://localhost:5000**

## 🎮 Your First Game

1. **Register an Account**
   - Username: Choose any username (3-20 chars)
   - Email: Your email address
   - Password: Secure password (min 6 chars)
   - Initials: 2 characters for your avatar

2. **Create a Room**
   - Click "CREATE ROOM"
   - Name your room
   - Choose a theme (e.g., "Gritty Sci-Fi")
   - Select max players (2-4)

3. **Invite Friends**
   - Share the 6-digit room code
   - Or send them the link

4. **Start Playing**
   - Wait for at least 2 players
   - Click "START GAME" when ready
   - Follow the prompts to build your story!

## 🎯 Game Flow

### Round Structure (15 Rounds Total)

**Setting Phase (Rounds 1-5)**
- Establish the world
- Define the atmosphere
- Introduce key elements

**Action Phase (Rounds 6-10)**
- Conflicts emerge
- Characters make decisions
- Events unfold

**Consequence Phase (Rounds 11-15)**
- Resolve storylines
- Reveal outcomes
- Conclude the narrative

### Each Round

1. **Submit** - Non-scribe players write a sentence (max 200 chars)
2. **Vote** - All vote for the most consistent sentence
3. **Scribe** - The scribe chooses from top 2 and adds a tag (3-5 words)
4. **Continue** - Move to next round with new scribe

## 🏆 Scoring

- **10 points** per vote received
- **25 points** for consistency bonus (if your sentence is chosen)
- **15 points** for scribe completion

## 📝 Tips for Great Stories

1. **Read the narrative** - Stay consistent with established tone
2. **Be concise** - Make every word count
3. **Build on previous** - Reference earlier contributions
4. **Respect the theme** - Maintain genre conventions
5. **Vote honestly** - Choose what fits best, not favorites

## 🛠️ Troubleshooting

### Can't connect to database?
```bash
# Check if MongoDB is running
mongo --eval "db.version()"

# Restart MongoDB
net restart MongoDB  # Windows
sudo systemctl restart mongod  # Linux
```

### Port already in use?
Edit `.env` file and change:
```
PORT=5001  # or any available port
```

### Dependencies error?
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Game won't start?
- Ensure minimum 2 players
- Check browser console for errors
- Refresh page and try again

## 🔧 Environment Variables

Edit `.env` file to configure:

```env
PORT=5000                              # Server port
MONGODB_URI=mongodb://localhost:27017/lorecraftr  # Database
JWT_SECRET=your-secret-key            # Authentication secret
CLIENT_URL=http://localhost:3000      # Frontend URL (for CORS)
```

## 📱 Browser Support

LoreCraftr works best on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🎨 Themes Available

1. **Gritty Sci-Fi** - Dystopian futures, space exploration
2. **High Fantasy** - Magic, dragons, ancient prophecies
3. **Weird West** - Supernatural western frontier
4. **Cyberpunk Noir** - Corporate intrigue, hackers, AI
5. **Cosmic Horror** - Eldritch beings, reality-bending

## 🆘 Need Help?

- Check `README.md` for detailed documentation
- Review API endpoints in documentation
- Check console logs for errors
- Ensure all dependencies are installed

## 🎉 Enjoy Crafting Stories!

Remember: The best stories come from collaboration, creativity, and consistency. Have fun!

---

**LoreCraftr** - Where narratives are forged through consensus.

# LoreCraftr - Development Guide

## 🏗️ Architecture Overview

LoreCraftr follows a modern web application architecture:

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│  - Vanilla JavaScript (ES6 Modules)             │
│  - Socket.IO Client                              │
│  - Client-side Routing                           │
└─────────────────┬───────────────────────────────┘
                  │
                  │ HTTP/WebSocket
                  │
┌─────────────────▼───────────────────────────────┐
│                   Backend                        │
│  - Express.js Server                             │
│  - Socket.IO Server                              │
│  - JWT Authentication                            │
│  - REST API                                      │
└─────────────────┬───────────────────────────────┘
                  │
                  │ Mongoose ODM
                  │
┌─────────────────▼───────────────────────────────┐
│                  Database                        │
│  - MongoDB                                       │
│  - Collections: Users, Rooms, Stories, etc.      │
└──────────────────────────────────────────────────┘
```

---

## 📂 Directory Structure Explained

### `/models` - Data Models
- **User.js** - User accounts with authentication
- **Room.js** - Game lobby/waiting room
- **Story.js** - Completed/in-progress stories
- **Prompt.js** - Story prompts by theme/category
- **Origin.js** - Story starting points
- **GameState.js** - Real-time game state (in-memory)

### `/routes` - API Endpoints
- **users.js** - User management (auth, profile)
- **rooms.js** - Room operations (create, join, start)
- **stories.js** - Story CRUD and contributions

### `/middleware` - Custom Middleware
- **auth.js** - JWT verification and auth helpers

### `/utils` - Utility Functions
- **scoring.js** - Game scoring calculations

### `/public` - Frontend Files
- **css/main.css** - All styles (minimalist)
- **js/app.js** - Main application entry
- **js/auth.js** - Authentication helpers
- **js/router.js** - Client-side routing
- **js/pages/** - Page components (SPA)

### `/scripts` - Utility Scripts
- **seedData.js** - Database seeding

---

## 🔄 Data Flow

### Authentication Flow
```
1. User submits login form
2. POST /api/users/login
3. Server verifies credentials
4. JWT token generated
5. Token stored in localStorage
6. Token sent in Authorization header for protected routes
```

### Game Flow
```
1. User creates room → POST /api/rooms/create
2. Other users join → POST /api/rooms/join/:roomId
3. Host starts game → POST /api/rooms/start/:roomId
4. WebSocket connection established
5. Game state initialized (in-memory)
6. For each round:
   a. Players submit sentences → emit('submit-sentence')
   b. Players vote → emit('submit-vote')
   c. Scribe chooses → emit('scribe-select')
   d. Round saved → POST /api/stories/contribute/:storyId
   e. Next round begins
7. Game completes after 15 rounds
8. Final story saved to database
```

---

## 🎮 Game State Management

### Server-Side (In-Memory)
```javascript
// Active games stored in Map
const activeGames = new Map();
// Key: roomId, Value: GameState instance

class GameState {
  - currentRound
  - submissions (Map)
  - votes (Map)
  - scribeId
  - players
  - methods: addSubmission(), addVote(), calculateTopVoted()
}
```

### Database (Persistent)
```javascript
// Story model stores completed rounds
Story {
  narrative: [
    { text, round, voteTally, scribeId, timestamp }
  ],
  scores: Map<userId, score>
}
```

---

## 🔐 Security Considerations

### Implemented
- ✅ Password hashing (bcrypt)
- ✅ JWT token authentication
- ✅ Password exclusion from JSON responses
- ✅ Input validation (schema-level)
- ✅ CORS configuration

### Recommended for Production
- 🔲 Rate limiting (express-rate-limit)
- 🔲 Helmet.js for security headers
- 🔲 HTTPS enforcement
- 🔲 Input sanitization (express-validator)
- 🔲 CSRF protection
- 🔲 SQL/NoSQL injection prevention
- 🔲 Session management improvements

---

## 🧪 Testing

### Unit Tests
```bash
npm test
```

Located in `/tests/game.test.js`:
- Scoring calculations
- GameState logic
- Phase transitions
- Scribe rotation

### Manual Testing Checklist

**Authentication:**
- [ ] Register new user
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Session persistence
- [ ] Logout

**Room Management:**
- [ ] Create room
- [ ] Join room
- [ ] Leave room
- [ ] Change theme (host only)
- [ ] Lock/unlock room (host only)
- [ ] Start game (host only, min 2 players)

**Gameplay:**
- [ ] Submit sentence (non-scribe)
- [ ] Vote for sentence (non-scribe)
- [ ] Scribe selection
- [ ] Round progression
- [ ] Score calculation
- [ ] Game completion

**Edge Cases:**
- [ ] Disconnection handling
- [ ] Room full
- [ ] Scribe leaves mid-game
- [ ] Player submits twice
- [ ] Vote before all submitted

---

## 🚀 Deployment

### Environment Setup
```bash
# Production environment variables
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=strong-random-secret
PORT=5000
CLIENT_URL=https://your-domain.com
```

### Deployment Options

#### 1. **Heroku**
```bash
heroku create lorecraftr
heroku addons:create mongolab
heroku config:set JWT_SECRET=your-secret
git push heroku main
```

#### 2. **DigitalOcean**
```bash
# Use App Platform or Droplet
# Configure MongoDB Atlas
# Set environment variables in control panel
```

#### 3. **AWS**
```bash
# Elastic Beanstalk + MongoDB Atlas
# Or EC2 + DocumentDB
```

#### 4. **Railway**
```bash
# Connect GitHub repo
# Add MongoDB plugin
# Set environment variables
# Deploy
```

### Pre-Deployment Checklist
- [ ] Set strong JWT_SECRET
- [ ] Configure production MongoDB
- [ ] Update CLIENT_URL for CORS
- [ ] Enable HTTPS
- [ ] Set up logging
- [ ] Configure error monitoring
- [ ] Set up backups
- [ ] Load test
- [ ] Security audit

---

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Development (with auto-restart)
npm run dev

# Production
npm start

# Seed database
npm run seed

# Run tests
npm test

# Clear and reseed
npm run seed
```

---

## 📊 Database Management

### Backup
```bash
# Export database
mongodump --uri="mongodb://localhost:27017/lorecraftr" --out=backup

# Import database
mongorestore --uri="mongodb://localhost:27017/lorecraftr" backup/lorecraftr
```

### Indexes
Recommended indexes for performance:
```javascript
// User collection
db.users.createIndex({ username: 1 }, { unique: true })
db.users.createIndex({ email: 1 }, { unique: true })

// Room collection
db.rooms.createIndex({ code: 1 }, { unique: true })
db.rooms.createIndex({ status: 1 })

// Story collection
db.stories.createIndex({ players: 1 })
db.stories.createIndex({ createdAt: -1 })

// Prompt collection
db.prompts.createIndex({ theme: 1, category: 1 })
```

---

## 🐛 Debugging

### Enable Debug Logging
```javascript
// In server.js, add:
const debug = require('debug')('lorecraftr:server');
debug('Server starting...');
```

### Common Issues

**MongoDB Connection Failed**
```bash
# Check MongoDB status
mongo --eval "db.version()"

# Check connection string
echo $MONGODB_URI
```

**WebSocket Not Connecting**
```javascript
// Check CORS settings in server.js
// Ensure client URL matches
// Check browser console for errors
```

**JWT Token Invalid**
```bash
# Clear localStorage
localStorage.clear()

# Verify JWT_SECRET matches between requests
```

---

## 🎨 Extending LoreCraftr

### Adding New Themes
1. Add theme to enums in models (Room, Prompt, Origin)
2. Create origins and prompts in `scripts/seedData.js`
3. Run `npm run seed`
4. Update frontend theme selector

### Adding Features

**New Scoring Rule:**
```javascript
// In utils/scoring.js
const POINTS = {
  VOTE_RECEIVED: 10,
  CONSISTENCY_BONUS: 25,
  SCRIBE_COMPLETION: 15,
  NEW_RULE: 20  // Add here
};
```

**New Game Phase:**
```javascript
// In models/GameState.js
getPhase() {
  if (this.currentRound <= 5) return 'SETTING';
  if (this.currentRound <= 10) return 'ACTION';
  if (this.currentRound <= 13) return 'CONSEQUENCE';
  if (this.currentRound <= 15) return 'EPILOGUE'; // New phase
}
```

**Custom Prompt Categories:**
```javascript
// In models/Prompt.js
category: {
  type: String,
  enum: ['SETTING', 'ACTION', 'CONSEQUENCE', 'TWIST'] // Add new
}
```

---

## 📈 Performance Optimization

### Frontend
- [ ] Minimize HTTP requests
- [ ] Lazy load images
- [ ] Use service workers for offline support
- [ ] Implement virtual scrolling for long narratives
- [ ] Cache static assets

### Backend
- [ ] Database query optimization
- [ ] Connection pooling
- [ ] Response caching
- [ ] Compression middleware
- [ ] CDN for static files

### Database
- [ ] Proper indexing
- [ ] Query performance monitoring
- [ ] Connection limits
- [ ] Sharding for scale

---

## 🤝 Contributing

### Code Style
- Use ES6+ features
- 2-space indentation
- Semicolons required
- Meaningful variable names
- Comments for complex logic

### Commit Messages
```
feat: Add new theme selection
fix: Resolve scoring calculation bug
docs: Update API documentation
style: Format code with prettier
test: Add GameState tests
refactor: Simplify vote counting logic
```

### Pull Request Process
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📚 Resources

- [Express.js Docs](https://expressjs.com/)
- [Socket.IO Docs](https://socket.io/docs/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [Mongoose Docs](https://mongoosejs.com/docs/)
- [JWT.io](https://jwt.io/)

---

## 🆘 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation
- Review API.md for endpoint details
- See QUICKSTART.md for setup help

---

**Happy Coding! 🖤**

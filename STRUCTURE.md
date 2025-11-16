# 🖤 LoreCraftr - Project Structure

```
LoreCraftr/
│
├── 📄 Configuration Files
│   ├── .env                    # Environment variables (local)
│   ├── .env.example            # Environment template
│   ├── .gitignore              # Git ignore rules
│   ├── package.json            # Dependencies & scripts
│   └── setup.ps1               # Windows setup script
│
├── 📚 Documentation (1,500+ lines)
│   ├── README.md               # Main documentation
│   ├── QUICKSTART.md           # 5-minute setup guide
│   ├── API.md                  # API reference
│   ├── DEVELOPMENT.md          # Developer guide
│   └── SUMMARY.md              # Implementation summary
│
├── 🚀 Server
│   └── server.js               # Express + Socket.IO server
│
├── 🔐 Middleware
│   └── middleware/
│       └── auth.js             # JWT authentication
│
├── 📊 Models (6 schemas)
│   └── models/
│       ├── User.js             # User accounts
│       ├── Room.js             # Game lobbies
│       ├── Story.js            # Persistent stories
│       ├── Prompt.js           # Story prompts
│       ├── Origin.js           # Story beginnings
│       └── GameState.js        # Real-time game state
│
├── 🛣️ Routes (24 endpoints)
│   └── routes/
│       ├── users.js            # User management (7 endpoints)
│       ├── rooms.js            # Room operations (9 endpoints)
│       └── stories.js          # Story endpoints (8 endpoints)
│
├── 🔧 Utilities
│   └── utils/
│       └── scoring.js          # Game scoring logic
│
├── 🎨 Frontend (SPA)
│   └── public/
│       ├── index.html          # App shell
│       │
│       ├── css/
│       │   └── main.css        # Minimalist styling
│       │
│       └── js/
│           ├── app.js          # Main entry point
│           ├── auth.js         # Auth helpers
│           ├── router.js       # Client routing
│           │
│           └── pages/
│               ├── login.js    # Login/Register
│               ├── dashboard.js # Main dashboard
│               ├── lobby.js    # Room lobby
│               └── game.js     # Game interface
│
├── 🗄️ Scripts
│   └── scripts/
│       └── seedData.js         # Database seeding (75+ prompts)
│
└── 🧪 Tests
    └── tests/
        └── game.test.js        # Unit tests
```

---

## 🔄 Application Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│                   USER JOURNEY                       │
└─────────────────────────────────────────────────────┘

        │
        ▼
┌───────────────┐
│  Login Page   │ ◄──── public/js/pages/login.js
└───────┬───────┘
        │ (authenticate)
        ▼
┌───────────────┐
│   Dashboard   │ ◄──── public/js/pages/dashboard.js
└───────┬───────┘       - Browse rooms
        │               - Create room
        │               - Join by code
        ▼
┌───────────────┐
│     Lobby     │ ◄──── public/js/pages/lobby.js
└───────┬───────┘       - Wait for players
        │               - Select theme
        │               - Start game (host)
        ▼
┌───────────────┐
│   Game Play   │ ◄──── public/js/pages/game.js
└───────┬───────┘       - 15 rounds
        │               - Submit → Vote → Scribe
        │               - Real-time updates
        ▼
┌───────────────┐
│ Story Complete│
└───────────────┘
```

---

## 🗄️ Database Schema Relationships

```
┌──────────┐
│   User   │
└────┬─────┘
     │
     │ has many
     ▼
┌──────────┐         ┌──────────┐
│   Room   │────────▶│  Story   │
└────┬─────┘ creates └──────────┘
     │
     │ uses
     ▼
┌──────────┐         ┌──────────┐
│  Origin  │         │  Prompt  │
└──────────┘         └──────────┘
     │                    │
     └──── filtered by ───┘
           Theme
```

---

## 🔌 API Architecture

```
┌─────────────────────────────────────────┐
│           Frontend (Browser)             │
│  - ES6 Modules                           │
│  - Fetch API (REST)                      │
│  - Socket.IO Client (WebSocket)          │
└───────────────┬─────────────────────────┘
                │
                │ HTTP/WebSocket
                │
┌───────────────▼─────────────────────────┐
│           Backend (Node.js)              │
│  ┌─────────────────────────────────┐   │
│  │        Express Server            │   │
│  │  - Routes (users, rooms, stories)│   │
│  │  - Middleware (auth)             │   │
│  │  - Error handling                │   │
│  └─────────┬───────────────────────┘   │
│            │                             │
│  ┌─────────▼───────────────────────┐   │
│  │      Socket.IO Server            │   │
│  │  - Game state management         │   │
│  │  - Real-time events              │   │
│  │  - Room broadcasting             │   │
│  └─────────┬───────────────────────┘   │
└────────────┼─────────────────────────┘
             │
             │ Mongoose ODM
             │
┌────────────▼─────────────────────────┐
│          MongoDB Database             │
│  - users                              │
│  - rooms                              │
│  - stories                            │
│  - prompts                            │
│  - origins                            │
└───────────────────────────────────────┘
```

---

## 🎮 Game State Flow

```
┌──────────────┐
│  Room Created │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Players Join  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Game Start   │──────┐
└──────┬───────┘      │
       │              │ Creates GameState
       │              │ (in-memory)
       ▼              │
┌──────────────┐      │
│ Round Begins  │◄─────┘
└──────┬───────┘
       │
       ├─────► Submit Phase (non-scribe players)
       │           │
       │           ▼
       ├─────► Voting Phase (non-scribe players)
       │           │
       │           ▼
       ├─────► Scribe Choice (scribe selects + adds tag)
       │           │
       │           ▼
       ├─────► Save to Database (Story model)
       │           │
       │           ▼
       └─────► Next Round (rotate scribe)
                   │
                   │ (repeat 15 times)
                   ▼
              ┌──────────────┐
              │ Game Complete │
              └──────────────┘
```

---

## 📦 Data Models Detail

### User Model
```
User {
  _id: ObjectId
  username: String (unique)
  email: String (unique)
  password: String (hashed)
  initials: String (2 chars)
  gamesPlayed: Number
  totalScore: Number
  createdAt: Date
}
```

### Room Model
```
Room {
  _id: ObjectId
  name: String
  code: String (6 chars, unique)
  host: ObjectId → User
  theme: String (enum)
  players: [ObjectId] → Users
  maxPlayers: Number (2-4)
  status: String (WAITING|IN_PROGRESS|COMPLETED)
  locked: Boolean
  currentStory: ObjectId → Story
  createdAt: Date
}
```

### Story Model
```
Story {
  _id: ObjectId
  theme: String
  origin: String
  narrative: [{
    text: String
    round: Number
    voteTally: [{ authorId, votes }]
    scribeId: ObjectId
    timestamp: Date
  }]
  currentRound: Number (1-15)
  scores: Map<UserId, Number>
  players: [ObjectId] → Users
  status: String (IN_PROGRESS|COMPLETED)
}
```

### GameState Model (In-Memory)
```
GameState {
  roomId: String
  currentRound: Number
  maxRounds: Number (15)
  phase: String (SETTING|ACTION|CONSEQUENCE)
  submissions: Map<PlayerId, Sentence>
  votes: Map<VoterId, SubmissionId>
  scribeId: String
  topVoted: Array
  players: Array
}
```

---

## 🎨 UI Component Tree

```
App (app.js)
├── Router (router.js)
│   └── Current Page Component
│       │
│       ├── LoginPage
│       │   ├── Logo
│       │   ├── Login Form
│       │   └── Register Form
│       │
│       ├── DashboardPage
│       │   ├── Header
│       │   │   ├── Logo
│       │   │   └── User Info
│       │   ├── Actions
│       │   │   ├── Create Room Button
│       │   │   └── Join Code Button
│       │   ├── Room List
│       │   │   └── Room Cards
│       │   └── Stats Section
│       │
│       ├── LobbyPage
│       │   ├── Room Header
│       │   │   ├── Room Name
│       │   │   └── Room Code
│       │   ├── Players List
│       │   ├── Theme Selector
│       │   └── Action Buttons
│       │
│       └── GamePage
│           ├── Game Header
│           │   ├── Round Info
│           │   └── Scribe Indicator
│           ├── Story Block
│           │   ├── Narrative
│           │   └── Current Prompt
│           ├── Game Phase
│           │   ├── Submit Phase
│           │   ├── Voting Phase
│           │   └── Scribe Choice
│           └── Scores Sidebar
└── Socket.IO Connection
```

---

## 🔄 File Dependencies

```
server.js
├── requires → express, socket.io, mongoose
├── imports → routes/users.js
│             routes/rooms.js
│             routes/stories.js
└── uses → models/GameState.js

routes/users.js
├── requires → express
├── imports → models/User.js
│             middleware/auth.js
└── exports → router

routes/rooms.js
├── requires → express
├── imports → models/Room.js
│             middleware/auth.js
└── exports → router

routes/stories.js
├── requires → express
├── imports → models/Story.js
│             models/Prompt.js
│             models/Origin.js
│             utils/scoring.js
└── exports → router

public/js/app.js
├── imports → auth.js
│             router.js
└── initializes → Socket.IO connection

public/js/pages/*.js
├── imports → auth.js
│             router.js
└── exports → Page class
```

---

## 📊 Code Statistics

| Category | Files | Lines |
|----------|-------|-------|
| Backend | 9 | ~1,200 |
| Frontend | 9 | ~1,500 |
| Models | 6 | ~400 |
| Routes | 3 | ~500 |
| Documentation | 5 | ~1,500 |
| Tests | 1 | ~100 |
| **Total** | **33** | **~5,200** |

---

## 🚀 Quick Reference

### Start Development
```bash
npm run dev
```

### Run Tests
```bash
npm test
```

### Seed Database
```bash
npm run seed
```

### Production Build
```bash
npm start
```

---

## 📂 File Size Breakdown

- **Largest Backend File:** `server.js` (~200 lines)
- **Largest Frontend File:** `game.js` (~300 lines)
- **Largest Model:** `Story.js` (~50 lines)
- **Largest Route:** `stories.js` (~150 lines)
- **Largest CSS:** `main.css` (~400 lines)
- **Largest Doc:** `DEVELOPMENT.md` (~500 lines)

---

**This structure provides a complete, production-ready collaborative storytelling game!** 🖤

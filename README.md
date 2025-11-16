# LoreCraftr

🖤 **A Minimalist Collaborative Story Game**

LoreCraftr is a black-and-white collaborative storytelling game that focuses on world-building and narrative consistency. Players work together to craft compelling stories through a structured voting system and rotating scribe roles.

## ✨ Features

- **Minimalist Black & White Design** - Clean, distraction-free interface
- **Collaborative Storytelling** - 2-4 players build narratives together
- **Voting-Based System** - Players vote for the most consistent contributions
- **Rotating Scribe Role** - Each round, a different player finalizes the narrative
- **Multiple Themes** - Choose from Gritty Sci-Fi, High Fantasy, Weird West, Cyberpunk Noir, or Cosmic Horror
- **15-Round Structure** - Stories unfold through Setting, Action, and Consequence phases
- **Real-time Gameplay** - Powered by WebSockets for instant updates

## 🎮 How to Play

1. **Create or Join a Room** - Set up a game with 2-4 players
2. **Choose a Theme** - Select your story's genre and setting
3. **Submit Sentences** - Write contributions that fit the established narrative
4. **Vote for Consistency** - Choose sentences that best match the story's tone
5. **Scribe's Turn** - The rotating Scribe picks from top-voted options and adds a tag
6. **Build the Story** - Continue for 15 rounds across three phases

## 🛠️ Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LoreCraftr
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and configure:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - A secure secret key for JWT tokens
   - `PORT` - Server port (default: 5000)

4. **Seed the database**
   ```bash
   npm run seed
   ```

5. **Start the server**
   ```bash
   npm start
   ```
   For development with auto-restart:
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5000`

## 📁 Project Structure

```
LoreCraftr/
├── models/              # Mongoose schemas
│   ├── User.js
│   ├── Room.js
│   ├── Story.js
│   ├── Prompt.js
│   ├── Origin.js
│   └── GameState.js
├── routes/              # Express routes
│   ├── users.js
│   ├── rooms.js
│   └── stories.js
├── middleware/          # Custom middleware
│   └── auth.js
├── utils/               # Utility functions
│   └── scoring.js
├── public/              # Frontend files
│   ├── css/
│   │   └── main.css
│   ├── js/
│   │   ├── app.js
│   │   ├── auth.js
│   │   ├── router.js
│   │   └── pages/
│   │       ├── login.js
│   │       ├── dashboard.js
│   │       ├── lobby.js
│   │       └── game.js
│   └── index.html
├── scripts/             # Utility scripts
│   └── seedData.js
├── server.js            # Main server file
├── package.json
└── README.md
```

## 🎯 Game Mechanics

### Scoring System

- **Vote Received**: 10 points per vote
- **Consistency Bonus**: 25 points for chosen sentence
- **Scribe Completion**: 15 points for finalizing the round

### Round Phases

- **Setting (Rounds 1-5)**: Establish the world and atmosphere
- **Action (Rounds 6-10)**: Introduce conflicts and events
- **Consequence (Rounds 11-15)**: Resolve the story and reveal outcomes

## 🔧 API Endpoints

### Users
- `POST /api/users/register` - Create new account
- `POST /api/users/login` - Authenticate user
- `GET /api/users/check-session` - Verify authentication
- `GET /api/users/profile/:username` - Get user profile
- `PATCH /api/users/profile` - Update profile
- `GET /api/users/stories` - Get user's stories

### Rooms
- `POST /api/rooms/create` - Create new room
- `GET /api/rooms/available` - List available rooms
- `GET /api/rooms/code/:code` - Get room by code
- `POST /api/rooms/join/:roomId` - Join room
- `POST /api/rooms/leave/:roomId` - Leave room
- `PATCH /api/rooms/theme/:roomId` - Change theme
- `POST /api/rooms/start/:roomId` - Start game

### Stories
- `GET /api/stories/theme/:theme/origins` - Get story origins
- `GET /api/stories/theme/:theme/prompts/:category` - Get prompts
- `POST /api/stories/create` - Create new story
- `POST /api/stories/contribute/:storyId` - Add contribution
- `GET /api/stories/:storyId` - Get story by ID

## 🔌 WebSocket Events

### Client → Server
- `join-room` - Join game room
- `init-game` - Initialize game state
- `submit-sentence` - Submit story contribution
- `submit-vote` - Vote for sentence
- `scribe-select` - Scribe chooses final sentence
- `leave-room` - Leave game room

### Server → Client
- `player-joined` - Player joined notification
- `player-left` - Player left notification
- `game-started` - Game initialized
- `submission-received` - Sentence submitted
- `voting-phase` - Start voting
- `vote-received` - Vote submitted
- `scribe-choice` - Scribe selection phase
- `round-complete` - Round finished
- `next-round` - New round started
- `game-complete` - Story completed

## 🎨 Design Philosophy

LoreCraftr embraces minimalism:
- **Monochrome palette** - Black, white, and shades of gray
- **Typography-focused** - IBM Plex Mono for clarity
- **Clean interfaces** - No clutter, just storytelling
- **Accessibility** - High contrast and readable text

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

Inspired by collaborative storytelling games and the power of minimalist design.

---

**Built with ❤️ and 🖤 by the LoreCraftr team**

# LoreCraftr API Documentation

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens are returned upon successful login/registration.

---

## Users API

### Register User
```http
POST /api/users/register
```

**Request Body:**
```json
{
  "username": "string (3-20 chars)",
  "email": "string (valid email)",
  "password": "string (min 6 chars)",
  "initials": "string (2 chars, optional)"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "_id": "string",
    "username": "string",
    "email": "string",
    "initials": "string",
    "gamesPlayed": 0,
    "totalScore": 0,
    "createdAt": "date"
  },
  "token": "string"
}
```

---

### Login User
```http
POST /api/users/login
```

**Request Body:**
```json
{
  "username": "string (username or email)",
  "password": "string"
}
```

**Response:** `200 OK`
```json
{
  "user": { /* User object */ },
  "token": "string"
}
```

---

### Check Session
```http
GET /api/users/check-session
```
**Headers:** Authorization required

**Response:** `200 OK`
```json
{
  "user": { /* User object */ }
}
```

---

### Get User Profile
```http
GET /api/users/profile/:username
```

**Response:** `200 OK`
```json
{
  "_id": "string",
  "username": "string",
  "initials": "string",
  "gamesPlayed": "number",
  "totalScore": "number",
  "createdAt": "date"
}
```

---

### Update Profile
```http
PATCH /api/users/profile
```
**Headers:** Authorization required

**Request Body:**
```json
{
  "initials": "string (optional)",
  "email": "string (optional)"
}
```

**Response:** `200 OK`
```json
{
  "user": { /* Updated user object */ }
}
```

---

### Update Password
```http
PATCH /api/users/password
```
**Headers:** Authorization required

**Request Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string (min 6 chars)"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password updated successfully"
}
```

---

### Get User Stories
```http
GET /api/users/stories
```
**Headers:** Authorization required

**Response:** `200 OK`
```json
[
  {
    "_id": "string",
    "theme": "string",
    "origin": "string",
    "narrative": [/* Story sentences */],
    "currentRound": "number",
    "scores": { /* Player scores */ },
    "status": "IN_PROGRESS | COMPLETED",
    "players": [/* Player objects */]
  }
]
```

---

### Delete Account
```http
DELETE /api/users/delete
```
**Headers:** Authorization required

**Response:** `200 OK`
```json
{
  "message": "Account deleted successfully"
}
```

---

## Rooms API

### Create Room
```http
POST /api/rooms/create
```
**Headers:** Authorization required

**Request Body:**
```json
{
  "name": "string (max 50 chars)",
  "theme": "Gritty Sci-Fi | High Fantasy | Weird West | Cyberpunk Noir | Cosmic Horror",
  "maxPlayers": "number (2-4, default 4)"
}
```

**Response:** `201 Created`
```json
{
  "_id": "string",
  "name": "string",
  "code": "string (6 chars)",
  "host": { /* User object */ },
  "theme": "string",
  "players": [/* User objects */],
  "maxPlayers": "number",
  "status": "WAITING",
  "locked": false,
  "createdAt": "date"
}
```

---

### Get Available Rooms
```http
GET /api/rooms/available
```

**Response:** `200 OK`
```json
[
  { /* Room objects */ }
]
```

---

### Get Room by Code
```http
GET /api/rooms/code/:code
```

**Response:** `200 OK`
```json
{
  /* Room object */
}
```

---

### Join Room
```http
POST /api/rooms/join/:roomId
```
**Headers:** Authorization required

**Response:** `200 OK`
```json
{
  /* Updated room object */
}
```

---

### Leave Room
```http
POST /api/rooms/leave/:roomId
```
**Headers:** Authorization required

**Response:** `200 OK`
```json
{
  /* Updated room object or deletion message */
}
```

---

### Change Theme
```http
PATCH /api/rooms/theme/:roomId
```
**Headers:** Authorization required (must be host)

**Request Body:**
```json
{
  "theme": "string"
}
```

**Response:** `200 OK`
```json
{
  /* Updated room object */
}
```

---

### Lock/Unlock Room
```http
PATCH /api/rooms/lock/:roomId
```
**Headers:** Authorization required (must be host)

**Response:** `200 OK`
```json
{
  /* Updated room object */
}
```

---

### Start Game
```http
POST /api/rooms/start/:roomId
```
**Headers:** Authorization required (must be host)

**Response:** `200 OK`
```json
{
  /* Updated room object with status IN_PROGRESS */
}
```

---

### Delete Room
```http
DELETE /api/rooms/:roomId
```
**Headers:** Authorization required (must be host)

**Response:** `200 OK`
```json
{
  "message": "Room deleted successfully"
}
```

---

## Stories API

### Get Theme Origins
```http
GET /api/stories/theme/:theme/origins
```

**Response:** `200 OK`
```json
[
  {
    "_id": "string",
    "theme": "string",
    "title": "string",
    "text": "string",
    "createdAt": "date"
  }
]
```

---

### Get Random Origin
```http
GET /api/stories/theme/:theme/origins/random
```

**Response:** `200 OK`
```json
{
  "_id": "string",
  "theme": "string",
  "title": "string",
  "text": "string"
}
```

---

### Get Theme Prompts
```http
GET /api/stories/theme/:theme/prompts/:category
```

**Parameters:**
- `category`: SETTING | ACTION | CONSEQUENCE

**Response:** `200 OK`
```json
[
  {
    "_id": "string",
    "theme": "string",
    "category": "string",
    "text": "string",
    "createdAt": "date"
  }
]
```

---

### Get Random Prompt
```http
GET /api/stories/theme/:theme/prompts/:category/random
```

**Response:** `200 OK`
```json
{
  "_id": "string",
  "theme": "string",
  "category": "string",
  "text": "string"
}
```

---

### Create Story
```http
POST /api/stories/create
```
**Headers:** Authorization required

**Request Body:**
```json
{
  "theme": "string",
  "origin": "string",
  "players": ["userId1", "userId2"]
}
```

**Response:** `201 Created`
```json
{
  "_id": "string",
  "theme": "string",
  "origin": "string",
  "narrative": [],
  "currentRound": 1,
  "scores": {},
  "players": [/* User IDs */],
  "status": "IN_PROGRESS"
}
```

---

### Get Story
```http
GET /api/stories/:storyId
```

**Response:** `200 OK`
```json
{
  /* Complete story object with populated players */
}
```

---

### Add Contribution
```http
POST /api/stories/contribute/:storyId
```
**Headers:** Authorization required

**Request Body:**
```json
{
  "chosenSentence": {
    "authorId": "string",
    "sentence": "string"
  },
  "scribeTag": "string",
  "voteTally": [
    {
      "submissionId": "string",
      "votes": "number"
    }
  ],
  "scribeId": "string"
}
```

**Response:** `200 OK`
```json
{
  /* Updated story object */
}
```

---

### Get User Stories
```http
GET /api/stories/user/:userId
```

**Response:** `200 OK`
```json
[
  { /* Story objects */ }
]
```

---

### Delete Story
```http
DELETE /api/stories/:storyId
```
**Headers:** Authorization required

**Response:** `200 OK`
```json
{
  "message": "Story deleted successfully"
}
```

---

## WebSocket Events

### Client → Server Events

#### join-room
```javascript
socket.emit('join-room', {
  roomId: 'string',
  userId: 'string',
  username: 'string'
});
```

#### init-game
```javascript
socket.emit('init-game', {
  roomId: 'string',
  players: [
    { id: 'string', name: 'string' }
  ]
});
```

#### submit-sentence
```javascript
socket.emit('submit-sentence', {
  roomId: 'string',
  playerId: 'string',
  sentence: 'string',
  playerName: 'string'
});
```

#### submit-vote
```javascript
socket.emit('submit-vote', {
  roomId: 'string',
  voterId: 'string',
  submissionId: 'string'
});
```

#### scribe-select
```javascript
socket.emit('scribe-select', {
  roomId: 'string',
  chosenId: 'string',
  scribeTag: 'string'
});
```

#### leave-room
```javascript
socket.emit('leave-room', {
  roomId: 'string',
  userId: 'string',
  username: 'string'
});
```

---

### Server → Client Events

#### player-joined
```javascript
socket.on('player-joined', ({ userId, username }) => {
  // Handle player joined
});
```

#### player-left
```javascript
socket.on('player-left', ({ userId, username }) => {
  // Handle player left
});
```

#### game-started
```javascript
socket.on('game-started', (data) => {
  // data: { currentRound, phase, scribeId, maxRounds }
});
```

#### submission-received
```javascript
socket.on('submission-received', (data) => {
  // data: { playerId, totalSubmissions, requiredSubmissions }
});
```

#### voting-phase
```javascript
socket.on('voting-phase', ({ submissions }) => {
  // submissions: [{ playerId, sentence, playerName }]
});
```

#### vote-received
```javascript
socket.on('vote-received', (data) => {
  // data: { voterId, totalVotes, requiredVotes }
});
```

#### scribe-choice
```javascript
socket.on('scribe-choice', ({ topVoted, scribeId }) => {
  // topVoted: [{ submissionId, votes, sentence }]
});
```

#### round-complete
```javascript
socket.on('round-complete', (data) => {
  // data: { chosenSentence, scribeTag, voteTally, round }
});
```

#### next-round
```javascript
socket.on('next-round', (data) => {
  // data: { currentRound, phase, scribeId }
});
```

#### game-complete
```javascript
socket.on('game-complete', () => {
  // Game finished
});
```

#### error
```javascript
socket.on('error', ({ message }) => {
  // Handle error
});
```

---

## Error Responses

All endpoints may return error responses:

### 400 Bad Request
```json
{
  "error": "Error message describing the issue"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Permission denied"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Server error message"
}
```

---

## Rate Limiting

Currently not implemented, but recommended for production:
- 100 requests per 15 minutes per IP
- 5 login attempts per hour per IP

---

## CORS

Configured to accept requests from `CLIENT_URL` environment variable.

Default: `http://localhost:3000`

---

## Data Models

### User
```javascript
{
  username: String (unique, 3-20 chars),
  email: String (unique),
  password: String (hashed),
  initials: String (2 chars, uppercase),
  gamesPlayed: Number,
  totalScore: Number,
  createdAt: Date
}
```

### Room
```javascript
{
  name: String (max 50 chars),
  code: String (6 chars, unique),
  host: ObjectId (User),
  theme: String (enum),
  players: [ObjectId] (User, 2-4),
  maxPlayers: Number (2-4),
  status: String (WAITING | IN_PROGRESS | COMPLETED),
  locked: Boolean,
  currentStory: ObjectId (Story),
  createdAt: Date
}
```

### Story
```javascript
{
  theme: String,
  origin: String,
  narrative: [{
    text: String,
    round: Number,
    voteTally: [{ authorId, votes }],
    scribeId: ObjectId,
    timestamp: Date
  }],
  currentRound: Number (1-15),
  scores: Map<String, Number>,
  players: [ObjectId] (User, 2-4),
  status: String (IN_PROGRESS | COMPLETED)
}
```

### Prompt
```javascript
{
  theme: String (enum),
  category: String (SETTING | ACTION | CONSEQUENCE),
  text: String (10-200 chars),
  createdAt: Date
}
```

### Origin
```javascript
{
  theme: String (enum),
  title: String (max 100 chars),
  text: String (20-500 chars),
  createdAt: Date
}
```

---

**LoreCraftr API v1.0** - Built for collaborative storytelling

# Live Leaderboard - Redis-First Backend Architecture

This project implements a Redis-first backend architecture for a live leaderboard application with real-time updates, caching, rate limiting, and LLM integration.

## Features

- **Redis Caching**: Question generation results cached with TTL (6 hours)
- **Rate Limiting**: Redis-based rate limiting using INCR/EXPIRE pattern
- **Leaderboard**: Redis Sorted Set for real-time leaderboard with ZINCRBY/ZREVRANGE
- **Real-time Updates**: Socket.IO for live score broadcasts
- **Session Management**: Redis store for Express sessions
- **Queue System**: Redis List (LPUSH/BLPOP) for background LLM processing
- **Pub/Sub**: Redis PUBLISH/SUBSCRIBE for admin notifications
- **MongoDB**: Permanent storage for user profiles, score history, question logs

## Project Structure

```
server/
├── src/
│   ├── config/           # Configuration files
│   │   └── redis.js      # Redis client configuration
│   ├── controllers/      # Request handlers
│   │   ├── questionController.js
│   │   └── scoreController.js
│   ├── middlewares/      # Express middlewares
│   │   └── rateLimiter.js
│   ├── models/           # MongoDB schemas
│   │   ├── userModel.js
│   │   ├── scoreModel.js
│   │   └── questionModel.js
│   ├── routes/           # API routes
│   │   ├── questionRoutes.js
│   │   └── scoreRoutes.js
│   ├── services/         # Business logic & Redis operations
│   │   ├── cacheService.js
│   │   ├── leaderboardService.js
│   │   ├── queueService.js
│   │   └── pubsubService.js
│   ├── adapters/         # LLM adapters
│   │   ├── groq.js
│   │   └── gemini.js
│   ├── workers/          # Background workers
│   │   └── questionWorker.js
│   ├── app.js            # Express app configuration
│   └── server.js         # Main server entry point
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose setup
├── package.json          # Dependencies
└── README.md             # Documentation
```

## API Endpoints

### Question Generation
- `POST /api/question/generate` - Generate GK questions (cached)
  - Body: `{ state, category, difficulty, userId }`
  - Response: `{ questions: [...], source: 'cache'|'LLM' }`

### Score Management
- `POST /api/score/update` - Update user score
  - Body: `{ userId, delta }`
  - Response: `{ leaderboard: [...] }`
- `GET /api/leaderboard` - Get top 10 leaderboard
  - Response: `{ leaderboard: [...] }`

### Admin
- `POST /api/quiz/publish` - Publish new quiz (Pub/Sub)
  - Body: `{ quizId, title }`
  - Response: `{ status: 'Quiz published' }`

## Redis Key Schema

| Key Pattern | Data Structure | TTL / Purpose |
|-------------|----------------|---------------|
| `question:{state}:{category}:{level}` | String (JSON) | TTL 6 hours (question cache) |
| `rate:{userId}` | String (counter) | TTL 1 hour (rate-limit counter) |
| `leaderboard` | Sorted Set | No TTL (global leaderboard) |
| `session:{sessionId}` | String/Hash | TTL 24 hours (session data) |
| `recent:{userId}` | List | LTRIM 10 (last 10 searches) |
| `popular:category` | Hash | No TTL (category->count) |
| `streak:{userId}` | String (counter) | TTL 24 hours (daily streak) |
| `questionQueue` | List | No TTL (LLM generation queue) |
| `quiz:new` | Pub/Sub channel | -- (admin notifications) |

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration

## Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Background Worker
```bash
npm run worker
```

### Docker
```bash
docker-compose up
```

## LLM Integration

The project includes placeholder adapters for Groq and Gemini LLMs. To implement real LLM calls:

1. Update `llm/groq.js` with actual Groq API calls
2. Update `llm/gemini.js` with actual Gemini API calls
3. Add API keys to `.env` file

## MongoDB Connection

Uncomment the MongoDB connection line in `server.js` and provide your `MONGO_URI` in `.env` to enable permanent storage.

## Technologies Used

- Node.js (Express)
- Redis (node-redis v4)
- Socket.IO
- MongoDB (Mongoose)
- Docker & Docker Compose

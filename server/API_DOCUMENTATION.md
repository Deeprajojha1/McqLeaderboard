# Live Leaderboard API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
- JWT Token stored in HTTP-only cookie
- Protected routes require authentication
- Token automatically sent with requests after login

---

## 1. Authentication APIs

### 1.1 Signup
**POST** `/api/auth/signup`

**Request Body:**
```json
{
  "username": "testuser",
  "password": "password123",
  "email": "test@example.com"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "userId": "507f1f77bcf86cd799439011",
  "username": "testuser",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 1.2 Login
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "username": "testuser",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "userId": "507f1f77bcf86cd799439011",
  "username": "testuser",
  "streak": 1,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 1.3 Logout
**POST** `/api/auth/logout`

**Headers:** Cookie with token

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

---

### 1.4 Get Profile (Protected)
**GET** `/api/auth/me`

**Headers:** Cookie with token

**Response (200):**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "testuser",
    "email": "test@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "streak": 5
}
```

---

### 1.5 Get Streak (Protected)
**GET** `/api/auth/streak`

**Headers:** Cookie with token

**Response (200):**
```json
{
  "streak": 5
}
```

---

## 2. Question Generation APIs

### 2.1 Generate Questions (Protected)
**POST** `/api/question/generate`

**Headers:** Cookie with token

**Request Body (Async - Queue-based):**
```json
{
  "state": "Uttar Pradesh",
  "category": "History",
  "difficulty": "Medium",
  "async": true
}
```

**Response (200) - Async:**
```json
{
  "message": "Question generation queued",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "source": "queue"
}
```

**Request Body (Sync - Direct LLM):**
```json
{
  "state": "Uttar Pradesh",
  "category": "History",
  "difficulty": "Medium",
  "async": false
}
```

**Response (200) - Sync:**
```json
{
  "questions": [
    {
      "id": "q1",
      "question": "Which city is the capital of Uttar Pradesh?",
      "options": [
        "Kanpur",
        "Lucknow",
        "Agra",
        "Varanasi"
      ],
      "correctAnswer": "Lucknow",
      "explanation": "Lucknow is the capital city of Uttar Pradesh.",
      "difficulty": "Medium",
      "category": "History",
      "state": "Uttar Pradesh",
      "points": 10
    }
  ],
  "source": "llm"
}
```

---

## 3. Quiz APIs

### 3.1 Get Quiz Questions (Public)
**GET** `/api/quiz/questions?state=Uttar Pradesh&category=History&difficulty=Medium`

**Response (200):**
```json
{
  "questions": [
    {
      "id": "q1",
      "question": "Which city is the capital of Uttar Pradesh?",
      "options": [
        "Kanpur",
        "Lucknow",
        "Agra",
        "Varanasi"
      ],
      "difficulty": "Medium",
      "category": "History",
      "state": "Uttar Pradesh",
      "points": 10
    }
  ]
}
```

---

### 3.2 Submit Quiz Answers (Protected)
**POST** `/api/quiz/submit`

**Headers:** Cookie with token

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "state": "Uttar Pradesh",
  "category": "History",
  "difficulty": "Medium",
  "answers": [
    {
      "questionId": "q1",
      "selectedAnswer": "Lucknow"
    },
    {
      "questionId": "q2",
      "selectedAnswer": "Agra"
    }
  ]
}
```

**Response (200):**
```json
{
  "summary": {
    "totalQuestions": 2,
    "correctCount": 1,
    "wrongCount": 1,
    "totalPoints": 10,
    "percentage": "50.00"
  },
  "results": [
    {
      "questionId": "q1",
      "selectedAnswer": "Lucknow",
      "correctAnswer": "Lucknow",
      "isCorrect": true,
      "points": 10,
      "message": "Correct!"
    },
    {
      "questionId": "q2",
      "selectedAnswer": "Agra",
      "correctAnswer": "Kanpur",
      "isCorrect": false,
      "points": 0,
      "message": "Incorrect"
    }
  ],
  "leaderboard": [
    {
      "userId": "507f1f77bcf86cd799439011",
      "score": 100
    },
    {
      "userId": "507f1f77bcf86cd799439012",
      "score": 80
    }
  ]
}
```

---

### 3.3 Get Question Result (Protected)
**GET** `/api/quiz/result/q1?state=Uttar Pradesh&category=History&difficulty=Medium`

**Headers:** Cookie with token

**Response (200):**
```json
{
  "question": {
    "id": "q1",
    "question": "Which city is the capital of Uttar Pradesh?",
    "options": [
      "Kanpur",
      "Lucknow",
      "Agra",
      "Varanasi"
    ],
    "correctAnswer": "Lucknow",
    "explanation": "Lucknow is the capital city of Uttar Pradesh.",
    "difficulty": "Medium",
    "category": "History",
    "state": "Uttar Pradesh",
    "points": 10
  }
}
```

---

## 4. Score & Leaderboard APIs

### 4.1 Update Score (Protected)
**POST** `/api/score/update`

**Headers:** Cookie with token

**Request Body:**
```json
{
  "delta": 10
}
```

**Response (200):**
```json
{
  "leaderboard": [
    {
      "userId": "507f1f77bcf86cd799439011",
      "score": 110
    },
    {
      "userId": "507f1f77bcf86cd799439012",
      "score": 80
    }
  ]
}
```

---

### 4.2 Get Leaderboard (Public)
**GET** `/api/score/`

**Response (200):**
```json
{
  "leaderboard": [
    {
      "userId": "507f1f77bcf86cd799439011",
      "score": 110
    },
    {
      "userId": "507f1f77bcf86cd799439012",
      "score": 80
    }
  ]
}
```

---

## 5. Analytics APIs

### 5.1 Get Recent Searches (Public)
**GET** `/api/analytics/recent-searches?userId=507f1f77bcf86cd799439011`

**Response (200):**
```json
{
  "searches": [
    "Uttar Pradesh:History",
    "Maharashtra:Geography",
    "Delhi:Politics"
  ]
}
```

---

### 5.2 Get Popular Categories (Public)
**GET** `/api/analytics/popular-categories`

**Response (200):**
```json
{
  "categories": [
    {
      "category": "History",
      "count": 150
    },
    {
      "category": "Geography",
      "count": 120
    },
    {
      "category": "Politics",
      "count": 90
    }
  ]
}
```

---

## 6. Admin APIs

### 6.1 Publish Quiz (Admin)
**POST** `/api/admin/quiz/publish`

**Request Body:**
```json
{
  "quizId": "quiz123",
  "title": "Uttar Pradesh History Quiz"
}
```

**Response (200):**
```json
{
  "status": "Quiz published"
}
```

---

## Testing Order (Recommended)

1. **Signup** → Create user account
2. **Login** → Get JWT token
3. **Generate Questions** (Sync mode for testing) → Get questions
4. **Get Quiz Questions** → Display questions to user
5. **Submit Quiz Answers** → Submit answers and get results
6. **Get Leaderboard** → Check leaderboard
7. **Get Profile** → Check user profile and streak
8. **Get Analytics** → Check recent searches and popular categories

---

## Important Notes

1. **Authentication**: After login, the token is stored in an HTTP-only cookie. Postman will automatically send it with subsequent requests.

2. **Rate Limiting**: Question generation is rate-limited to 10 requests per hour per user.

3. **Caching**: Questions are cached in Redis for 6 hours. Subsequent requests for the same parameters will return cached data.

4. **MongoDB Fallback**: If Redis is down, the system falls back to MongoDB for data retrieval.

5. **LLM Fallback**: If Groq API fails, the system automatically falls back to Gemini API.

6. **Socket.IO**: Real-time leaderboard updates are sent via Socket.IO events.

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "No token provided"
}
```

### 400 Bad Request
```json
{
  "error": "Invalid request body"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too Many Requests"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

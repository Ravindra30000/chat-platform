TechSurf 2025 Chat Agent Platform - Core API
A production-ready Node.js/Express API server with TypeScript, streaming support, and Groq LLM integration for building chat agents.

Features
✅ Core Functionality

RESTful API with Express.js and TypeScript

Real-time streaming responses using Server-Sent Events (SSE)

Groq LLM integration with llama-3.1-70b-versatile model

Request validation using Zod schemas

Comprehensive error handling and logging

✅ Security & Performance

CORS configuration with origin validation

Rate limiting (general API and chat-specific)

Request size validation

Helmet security headers

Compression middleware

✅ Developer Experience

Hot reloading with tsx

TypeScript with strict configuration

ESLint for code quality

Comprehensive logging and debugging

Environment variable validation

Quick Start
1. Installation
bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
2. Environment Setup
Edit .env file with your configuration:

text
# Server Configuration
PORT=3001
NODE_ENV=development

# API Keys
GROQ_API_KEY=your_groq_api_key_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Logging
LOG_LEVEL=info
3. Get Groq API Key
Visit Groq Console

Sign up or log in

Navigate to API Keys section

Create a new API key

Copy the key to your .env file

4. Start Development Server
bash
# Development mode with hot reloading
npm run dev

# Production build
npm run build
npm start
API Endpoints
Health Check
text
GET /health
GET /health?detailed=true
Chat API
text
# Send chat message (streaming by default)
POST /api/chat
Content-Type: application/json

{
  "message": "Hello, how are you?",
  "conversationId": "optional-uuid",
  "userId": "optional-user-id",
  "context": {},
  "stream": true
}

# Dedicated streaming endpoint
POST /api/chat/stream

# Get available models
GET /api/chat/models

# Test endpoint
GET /api/chat/test
GET /api/chat/test?stream=true
Server-Sent Events (SSE) Response Format
When streaming is enabled, responses are sent as Server-Sent Events:

javascript
// Content chunk
{
  "id": "request-id",
  "type": "content",
  "content": "Hello",
  "metadata": { "timestamp": "2025-09-20T15:07:00.000Z" }
}

// Completion signal
{
  "id": "request-id", 
  "type": "done",
  "metadata": {
    "completed": true,
    "fullContent": "Hello there! How can I help you?",
    "timestamp": "2025-09-20T15:07:00.000Z"
  }
}

// Error
{
  "id": "request-id",
  "type": "error", 
  "error": "Error message",
  "metadata": { "timestamp": "2025-09-20T15:07:00.000Z" }
}
Project Structure
text
src/
├── app.ts              # Main Express app configuration
├── server.ts           # Server startup and lifecycle
├── config/
│   └── env.ts          # Environment variables validation
├── middleware/
│   ├── auth.ts         # Authentication middleware
│   ├── cors.ts         # CORS configuration  
│   ├── rateLimit.ts    # Rate limiting middleware
│   └── validation.ts   # Request validation with Zod
├── routes/
│   └── chat.ts         # Chat API endpoints
├── services/
│   ├── llm.ts          # Groq LLM integration
│   └── streaming.ts    # Server-Sent Events service
└── types/
    └── index.ts        # TypeScript type definitions
Testing
Manual Testing with curl
bash
# Health check
curl http://localhost:3001/health

# Non-streaming chat
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "stream": false}'

# Streaming chat (SSE)
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"message": "Tell me a story", "stream": true}'

# Test endpoint
curl http://localhost:3001/api/chat/test?stream=true
Frontend Integration Example
javascript
// Streaming chat with fetch API
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
  },
  body: JSON.stringify({
    message: 'Hello!',
    stream: true
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));

      if (data.type === 'content') {
        console.log('Content:', data.content);
      } else if (data.type === 'done') {
        console.log('Stream completed');
        break;
      }
    }
  }
}
Rate Limiting
General API: 100 requests per 15 minutes per IP

Chat endpoints: 20 requests per minute per user/IP

Streaming: 10 concurrent streams per 5 minutes per user/IP

Environment Variables
Variable	Required	Default	Description
PORT	No	3001	Server port
NODE_ENV	No	development	Environment mode
GROQ_API_KEY	Yes	-	Groq API key
RATE_LIMIT_WINDOW_MS	No	900000	Rate limit window (ms)
RATE_LIMIT_MAX_REQUESTS	No	100	Max requests per window
ALLOWED_ORIGINS	No	localhost URLs	CORS allowed origins
LOG_LEVEL	No	info	Logging level
Development Scripts
bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start           # Start production server
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint issues
npm run test        # Run tests (when implemented)
Next Steps
This is Session 1 of the TechSurf platform development. Next sessions will include:

Session 2: Contentstack MCP integration

Session 3: React Chat SDK development

Session 4: Developer Dashboard (Next.js)

Session 5: Production deployment and monitoring

Troubleshooting
Common Issues
Port already in use

bash
# Kill process using port 3001
lsof -ti:3001 | xargs kill
Groq API key issues

Verify your API key is correct

Check if you have API credits

Ensure no extra spaces in .env file

CORS errors

Add your frontend URL to ALLOWED_ORIGINS

Check if the origin header is being sent

Rate limiting

Wait for the rate limit window to reset

Use different IP/user for testing

Disable rate limiting in test environment

Support
For issues and questions:

Check the console logs for detailed error messages

Verify all environment variables are set correctly

Test with the /health?detailed=true endpoint

Use the /api/chat/test endpoint for connectivity testing

Built for TechSurf 2025 Hackathon 🚀
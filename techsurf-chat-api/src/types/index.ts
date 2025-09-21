export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  userId?: string;
  context?: Record<string, unknown>;
  stream?: boolean;
}

export interface ChatResponse {
  id: string;
  message: ChatMessage;
  conversationId: string;
  timestamp: Date;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface StreamChunk {
  id: string;
  type: "content" | "done" | "error";
  content?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface LLMProvider {
  name: string;
  model: string;
  apiKey: string;
  baseURL?: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason?: string;
}

export interface ConversationContext {
  id: string;
  messages: ChatMessage[];
  userId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode: number;
}

export interface HealthStatus {
  status: "healthy" | "unhealthy";
  timestamp: Date;
  version: string;
  uptime: number;
  dependencies: {
    groq: "connected" | "disconnected";
    [key: string]: "connected" | "disconnected";
  };
}

export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
}

// Environment configuration types
export interface EnvConfig {
  port: number;
  nodeEnv: "development" | "production" | "test";
  groqApiKey: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  allowedOrigins: string[];
  logLevel: "error" | "warn" | "info" | "debug";
}

// Request/Response extended types for Express
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        [key: string]: unknown;
      };
      rateLimitInfo?: RateLimitInfo;
      requestId: string;
    }
  }
}

export {};

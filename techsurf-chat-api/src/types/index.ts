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
  useContentstack?: boolean;
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
  contentStackResults?: ContentstackResult[];
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
    contentstack: "connected" | "disconnected";
    cache: "connected" | "disconnected";
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
  // Contentstack configuration
  contentstackApiKey?: string;
  contentstackDeliveryToken?: string;
  contentstackEnvironment?: string;
  contentstackRegion?: string;
  // Cache configuration
  redisUrl?: string;
  redisTtl?: number;
  cacheEnabled?: boolean;
  cacheTtlSeconds?: number;
  memoryCacheMaxItems?: number;
  // Content search configuration
  contentSearchLimit?: number;
  contentRelevanceThreshold?: number;
  enableSemanticSearch?: boolean;
}

// Contentstack MCP Types
export interface ContentstackConfig {
  apiKey: string;
  deliveryToken: string;
  environment: string;
  region?: string;
}

export interface ContentstackEntry {
  uid: string;
  title?: string;
  url?: string;
  content_type_uid: string;
  locale: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface ContentstackResult {
  entry: ContentstackEntry;
  relevanceScore: number;
  contentType: string;
  extractedText: string;
  metadata: {
    title?: string;
    description?: string;
    tags?: string[];
    category?: string;
  };
}

export interface ContentSearchQuery {
  query: string;
  contentTypes?: string[];
  limit?: number;
  locale?: string;
  filters?: Record<string, any>;
  includeFields?: string[];
  excludeFields?: string[];
}

export interface ContentSearchResult {
  results: ContentstackResult[];
  totalCount: number;
  searchQuery: string;
  executionTime: number;
  cacheHit: boolean;
}

export interface MCPResponse {
  success: boolean;
  data?: ContentSearchResult;
  error?: string;
  cached?: boolean;
  executionTime: number;
}

// Cache-related types
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  hitRate: number;
}

// Content matching types
export interface MatchingOptions {
  threshold: number;
  includeMetadata: boolean;
  maxResults: number;
  boostFields?: Record<string, number>;
}

export interface SemanticMatchResult {
  content: ContentstackEntry;
  score: number;
  matches: {
    field: string;
    value: string;
    score: number;
  }[];
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
      contentContext?: ContentstackResult[];
    }
  }
}

export {};

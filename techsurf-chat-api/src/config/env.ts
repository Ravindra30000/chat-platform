import dotenv from "dotenv";
import { z } from "zod";
import { EnvConfig } from "../types";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("3001").transform(Number),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
  RATE_LIMIT_WINDOW_MS: z.string().default("900000").transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default("100").transform(Number),
  ALLOWED_ORIGINS: z
    .string()
    .default("http://localhost:3000,http://localhost:5173"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),

  // Contentstack configuration
  CONTENTSTACK_API_KEY: z.string().optional(),
  CONTENTSTACK_DELIVERY_TOKEN: z.string().optional(),
  CONTENTSTACK_ENVIRONMENT: z.string().default("development"),
  CONTENTSTACK_REGION: z.string().default("us"),

  // Cache configuration
  REDIS_URL: z.string().optional(),
  REDIS_TTL: z.string().default("3600").transform(Number),
  CACHE_ENABLED: z
    .string()
    .default("true")
    .transform((val) => val === "true"),
  CACHE_TTL_SECONDS: z.string().default("3600").transform(Number),
  MEMORY_CACHE_MAX_ITEMS: z.string().default("1000").transform(Number),

  // Content search configuration
  CONTENT_SEARCH_LIMIT: z.string().default("10").transform(Number),
  CONTENT_RELEVANCE_THRESHOLD: z.string().default("0.3").transform(Number),
  ENABLE_SEMANTIC_SEARCH: z
    .string()
    .default("true")
    .transform((val) => val === "true"),
});

export const validateEnv = (): EnvConfig => {
  try {
    const parsed = envSchema.parse(process.env);

    return {
      port: parsed.PORT,
      nodeEnv: parsed.NODE_ENV,
      groqApiKey: parsed.GROQ_API_KEY,
      rateLimitWindowMs: parsed.RATE_LIMIT_WINDOW_MS,
      rateLimitMaxRequests: parsed.RATE_LIMIT_MAX_REQUESTS,
      allowedOrigins: parsed.ALLOWED_ORIGINS.split(",").map((origin) =>
        origin.trim()
      ),
      logLevel: parsed.LOG_LEVEL,

      // Contentstack configuration
      contentstackApiKey: parsed.CONTENTSTACK_API_KEY,
      contentstackDeliveryToken: parsed.CONTENTSTACK_DELIVERY_TOKEN,
      contentstackEnvironment: parsed.CONTENTSTACK_ENVIRONMENT,
      contentstackRegion: parsed.CONTENTSTACK_REGION,

      // Cache configuration
      redisUrl: parsed.REDIS_URL,
      redisTtl: parsed.REDIS_TTL,
      cacheEnabled: parsed.CACHE_ENABLED,
      cacheTtlSeconds: parsed.CACHE_TTL_SECONDS,
      memoryCacheMaxItems: parsed.MEMORY_CACHE_MAX_ITEMS,

      // Content search configuration
      contentSearchLimit: parsed.CONTENT_SEARCH_LIMIT,
      contentRelevanceThreshold: parsed.CONTENT_RELEVANCE_THRESHOLD,
      enableSemanticSearch: parsed.ENABLE_SEMANTIC_SEARCH,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .map((issue) => issue.path.join("."))
        .join(", ");
      throw new Error(
        `Environment validation failed. Missing or invalid: ${missingVars}`
      );
    }
    throw error;
  }
};

export const config = validateEnv();

// Validate critical environment variables on startup
if (!config.groqApiKey) {
  throw new Error("GROQ_API_KEY environment variable is required");
}

// Warn about Contentstack configuration
if (!config.contentstackApiKey || !config.contentstackDeliveryToken) {
  console.warn(
    "⚠️  Contentstack credentials not provided. MCP features will be disabled."
  );
}

export default config;

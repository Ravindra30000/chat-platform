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

export default config;

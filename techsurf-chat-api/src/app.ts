import express from "express";
import helmet from "helmet";
import compression from "compression";
import { corsMiddleware } from "./middleware/cors";
import { generalRateLimit, conditionalRateLimit } from "./middleware/rateLimit";
import { requestId } from "./middleware/validation";
import chatRoutes from "./routes/chat";
import { llmService } from "./services/llm";
import { config } from "./config/env";
import { HealthStatus } from "./types";

const app = express();

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set("trust proxy", 1);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for SSE compatibility
  })
);

// CORS middleware
app.use(corsMiddleware);

// Compression middleware
app.use(compression());

// Request parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Global middleware
app.use(requestId);

// Global rate limiting
app.use(conditionalRateLimit(generalRateLimit));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${req.requestId}] ${req.method} ${req.path} - ${req.ip}`);
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${req.requestId}] ${res.statusCode} - ${duration}ms`);
  });

  next();
});

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const healthStatus: HealthStatus = {
      status: "healthy",
      timestamp: new Date(),
      version: "1.0.0",
      uptime: process.uptime(),
      dependencies: {
        groq: (await llmService.validateConnection())
          ? "connected"
          : "disconnected",
      },
    };

    // Check if detailed health check is requested
    if (req.query.detailed === "true") {
      const apiKeyCheck = await llmService.checkApiKeyValidity();
      const models = await llmService.getAvailableModels();

      (healthStatus as any).details = {
        apiKey: apiKeyCheck,
        availableModels: models,
        environment: config.nodeEnv,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      };
    }

    const statusCode = healthStatus.status === "healthy" ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date(),
      version: "1.0.0",
      uptime: process.uptime(),
      error: error instanceof Error ? error.message : "Unknown error",
      dependencies: {
        groq: "disconnected",
      },
    });
  }
});

// API routes
app.use("/api/chat", chatRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    name: "TechSurf 2025 Chat Agent Platform API",
    version: "1.0.0",
    description:
      "A production-ready chat API with streaming support and Groq integration",
    endpoints: {
      health: "/health",
      chat: "/api/chat",
      chatStream: "/api/chat/stream",
      models: "/api/chat/models",
      test: "/api/chat/test",
    },
    documentation: "https://github.com/techsurf/chat-platform",
    timestamp: new Date().toISOString(),
  });
});

// API not found handler
app.use("/api/*", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    message: `The endpoint ${req.method} ${req.path} does not exist`,
    availableEndpoints: {
      "GET /health": "Health check",
      "POST /api/chat": "Send chat message",
      "POST /api/chat/stream": "Send streaming chat message",
      "GET /api/chat/models": "Get available models",
      "GET /api/chat/test": "Test endpoint",
    },
  });
});

// Global error handler
app.use(
  (
    error: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(`[${req.requestId}] Unhandled error:`, error);

    // Don't send error details in production
    const isDevelopment = config.nodeEnv === "development";

    res.status(500).json({
      error: "Internal server error",
      message: isDevelopment ? error.message : "Something went wrong",
      requestId: req.requestId,
      ...(isDevelopment && { stack: error.stack }),
    });
  }
);

// 404 handler for non-API routes
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Resource not found",
    message: `The resource ${req.method} ${req.originalUrl} was not found`,
    timestamp: new Date().toISOString(),
  });
});

export default app;

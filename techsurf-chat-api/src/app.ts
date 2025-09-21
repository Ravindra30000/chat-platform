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

// Safe service imports with error handling
let cacheService: any = null;
let contentstackMCP: any = null;

try {
  const cacheModule = require("./services/cache");
  cacheService = cacheModule.cacheService;
  console.log("✅ Cache service loaded");
} catch (error) {
  console.warn("⚠️  Cache service not available:", error);
}

try {
  const mcpModule = require("./services/contentstack-mcp");
  contentstackMCP = mcpModule.contentstackMCP;
  console.log("✅ Contentstack MCP loaded");
} catch (error) {
  console.warn("⚠️  Contentstack MCP not available:", error);
}

// Enhanced health check endpoint with safe service checks
app.get("/health", async (req, res) => {
  try {
    const detailed = req.query.detailed === "true";

    const healthStatus: HealthStatus = {
      status: "healthy",
      timestamp: new Date(),
      version: "1.0.0",
      uptime: process.uptime(),
      dependencies: {
        groq: "disconnected",
        contentstack: "disconnected",
        cache: "disconnected",
      },
    };

    // Check LLM service (CRITICAL)
    try {
      const groqConnected = await llmService.validateConnection();
      healthStatus.dependencies.groq = groqConnected
        ? "connected"
        : "disconnected";
      console.log(`Groq connection: ${healthStatus.dependencies.groq}`);
    } catch (error) {
      console.warn("Groq health check failed:", error);
      healthStatus.dependencies.groq = "disconnected";
    }

    // Check Contentstack MCP (OPTIONAL)
    try {
      if (contentstackMCP && typeof contentstackMCP.testMCP === "function") {
        const mcpTest = await contentstackMCP.testMCP();
        healthStatus.dependencies.contentstack = mcpTest.contentstack
          ? "connected"
          : "disconnected";
      } else {
        healthStatus.dependencies.contentstack = "not-configured";
      }
    } catch (error) {
      console.warn("Contentstack health check failed:", error);
      healthStatus.dependencies.contentstack = "disconnected";
    }

    // Check cache service (OPTIONAL)
    try {
      if (cacheService && typeof cacheService.isConnected === "function") {
        const cacheConnected = await cacheService.isConnected();
        healthStatus.dependencies.cache =
          cacheConnected.redis || cacheConnected.memory
            ? "connected"
            : "disconnected";
      } else {
        healthStatus.dependencies.cache = "not-configured";
      }
    } catch (error) {
      console.warn("Cache health check failed:", error);
      healthStatus.dependencies.cache = "disconnected";
    }

    // Determine overall health status (only Groq is critical)
    const criticalServices = ["groq"];
    const isCriticalHealthy = criticalServices.every(
      (service) => healthStatus.dependencies[service] === "connected"
    );

    healthStatus.status = isCriticalHealthy ? "healthy" : "unhealthy";

    // Add detailed information if requested
    if (detailed) {
      try {
        const apiKeyCheck = await llmService.checkApiKeyValidity();
        const models = await llmService.getAvailableModels();

        (healthStatus as any).details = {
          groq: {
            apiKeyValid: apiKeyCheck.valid,
            availableModels: models,
            currentModel: llmService.getModelInfo().name,
            error: apiKeyCheck.error,
          },
          contentstack: {
            configured: !!contentstackMCP,
            available: contentstackMCP ? "loaded" : "not-loaded",
          },
          cache: {
            configured: !!cacheService,
            available: cacheService ? "loaded" : "not-loaded",
          },
          environment: config.nodeEnv,
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
        };
      } catch (error) {
        (healthStatus as any).details = {
          error: "Failed to gather detailed health information",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
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
        contentstack: "disconnected",
        cache: "disconnected",
      },
    });
  }
});

// API routes
app.use("/api/chat", chatRoutes);

// Root endpoint with enhanced information
app.get("/", (req, res) => {
  res.json({
    name: "TechSurf 2025 Chat Agent Platform API",
    version: "1.0.0",
    description:
      "Production-ready chat API with optional Contentstack MCP integration",
    status: "Core functionality available",
    features: [
      "Groq LLM Integration (llama-3.1-8b-instant)",
      "Server-Side Events Streaming",
      "Rate Limiting & Security",
      "Contentstack MCP (optional)",
      "Caching Layer (optional)",
    ],
    endpoints: {
      health: "/health",
      healthDetailed: "/health?detailed=true",
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
      "GET /health": "Health check with dependency status",
      "POST /api/chat": "Send chat message",
      "POST /api/chat/stream": "Send streaming chat message",
      "GET /api/chat/models": "Get available LLM models",
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
    suggestion: "Check the API documentation for available endpoints",
    timestamp: new Date().toISOString(),
  });
});

export default app;

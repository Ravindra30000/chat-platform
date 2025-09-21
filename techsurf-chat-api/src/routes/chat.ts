import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { llmService } from "../services/llm";
import { contentstackMCP } from "../services/contentstack-mcp";
import { streamingService } from "../services/streaming";
import {
  validate,
  chatRequestSchema,
  chatQuerySchema,
  validateContentType,
  validateRequestSize,
  requestId,
} from "../middleware/validation";
import {
  chatRateLimit,
  streamRateLimit,
  conditionalRateLimit,
} from "../middleware/rateLimit";
import { optionalAuth } from "../middleware/auth";
import { ChatMessage, ChatRequest, LLMResponse } from "../types";
import { z } from "zod";

const router = Router();

// Update chat request schema to include Contentstack options
const enhancedChatRequestSchema = chatRequestSchema.extend({
  useContentstack: z.boolean().default(true),
  contentTypes: z.array(z.string()).optional(),
  maxContextLength: z.number().min(500).max(4000).optional(),
});

// Middleware for all chat routes
router.use(requestId);
router.use(optionalAuth);
router.use(validateContentType);
router.use(validateRequestSize(1024 * 10)); // 10KB limit

// POST /api/chat - Main chat endpoint with streaming support and Contentstack integration
router.post(
  "/",
  conditionalRateLimit(chatRateLimit),
  validate({ body: enhancedChatRequestSchema, query: chatQuerySchema }),
  async (req: Request, res: Response) => {
    try {
      const {
        message,
        conversationId,
        userId,
        context,
        stream,
        useContentstack,
        contentTypes,
        maxContextLength,
      } = req.body as ChatRequest & {
        useContentstack?: boolean;
        contentTypes?: string[];
        maxContextLength?: number;
      };

      const shouldStream = stream !== false; // Default to streaming

      console.log(
        `[${req.requestId}] Processing chat request - Stream: ${shouldStream}, Contentstack: ${useContentstack}`
      );

      // Create conversation history
      const messages: ChatMessage[] = [
        {
          id: uuidv4(),
          role: "system",
          content:
            "You are a helpful AI assistant. Provide clear, accurate, and helpful responses based on the available information.",
          timestamp: new Date(),
        },
        {
          id: uuidv4(),
          role: "user",
          content: message,
          timestamp: new Date(),
          metadata: { userId, context },
        },
      ];

      if (shouldStream) {
        // Initialize Server-Sent Events
        streamingService.initializeSSE(res, req.requestId);

        // Generate streaming response with Contentstack integration
        const streamGenerator = (await llmService.generateResponse(
          messages,
          true,
          {
            useContentstack,
            contentTypes,
            maxContextLength,
          }
        )) as AsyncIterable<string>;

        await streamingService.processLLMStream(
          res,
          req.requestId,
          streamGenerator
        );
      } else {
        // Generate non-streaming response with Contentstack integration
        const response = (await llmService.generateResponse(messages, false, {
          useContentstack,
          contentTypes,
          maxContextLength,
        })) as LLMResponse;

        res.json({
          id: req.requestId,
          message: {
            id: uuidv4(),
            role: "assistant",
            content: response.content,
            timestamp: new Date(),
          },
          conversationId: conversationId || uuidv4(),
          usage: response.usage,
          model: response.model,
          enhancedWithContent: useContentstack,
        });
      }
    } catch (error) {
      console.error(`[${req.requestId}] Chat error:`, error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      const statusCode =
        error instanceof Error && error.message.includes("rate limit")
          ? 429
          : 500;

      if (res.headersSent) {
        // If streaming has started, send error through stream
        streamingService.sendSSEError(res, req.requestId, errorMessage);
      } else {
        res.status(statusCode).json({
          error: "Chat processing failed",
          message: errorMessage,
          requestId: req.requestId,
        });
      }
    }
  }
);

// POST /api/chat/stream - Dedicated streaming endpoint with Contentstack
router.post(
  "/stream",
  conditionalRateLimit(streamRateLimit),
  validate({ body: enhancedChatRequestSchema }),
  async (req: Request, res: Response) => {
    try {
      const {
        message,
        conversationId,
        userId,
        context,
        useContentstack = true,
        contentTypes,
        maxContextLength,
      } = req.body as ChatRequest & {
        useContentstack?: boolean;
        contentTypes?: string[];
        maxContextLength?: number;
      };

      console.log(
        `[${req.requestId}] Processing streaming chat request with Contentstack: ${useContentstack}`
      );

      // Initialize SSE immediately
      streamingService.initializeSSE(res, req.requestId);

      const messages: ChatMessage[] = [
        {
          id: uuidv4(),
          role: "system",
          content:
            "You are a helpful AI assistant with access to a knowledge base. Provide clear, accurate, and helpful responses.",
          timestamp: new Date(),
        },
        {
          id: uuidv4(),
          role: "user",
          content: message,
          timestamp: new Date(),
          metadata: { userId, context },
        },
      ];

      const streamGenerator = (await llmService.generateResponse(
        messages,
        true,
        {
          useContentstack,
          contentTypes,
          maxContextLength,
        }
      )) as AsyncIterable<string>;

      await streamingService.processLLMStream(
        res,
        req.requestId,
        streamGenerator
      );
    } catch (error) {
      console.error(`[${req.requestId}] Streaming chat error:`, error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      streamingService.sendSSEError(res, req.requestId, errorMessage);
    }
  }
);

// GET /api/chat/content-types - Get available Contentstack content types
router.get("/content-types", async (req: Request, res: Response) => {
  try {
    const contentTypes = await contentstackMCP.getAvailableContentTypes();

    res.json({
      contentTypes,
      count: contentTypes.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching content types:", error);
    res.status(500).json({
      error: "Failed to fetch content types",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/chat/search-content - Direct content search endpoint
router.post(
  "/search-content",
  validate({
    body: z.object({
      query: z.string().min(1, "Query is required"),
      contentTypes: z.array(z.string()).optional(),
      maxResults: z.number().min(1).max(20).default(5),
      useCache: z.boolean().default(true),
    }),
  }),
  async (req: Request, res: Response) => {
    try {
      const { query, contentTypes, maxResults, useCache } = req.body;

      console.log(`[${req.requestId}] Content search request: "${query}"`);

      const mcpResponse = await contentstackMCP.searchAndFormatContent(query, {
        contentTypes,
        maxResults,
        useCache,
      });

      if (!mcpResponse.success) {
        return res.status(500).json({
          error: "Content search failed",
          message: mcpResponse.error,
          requestId: req.requestId,
        });
      }

      res.json({
        results: mcpResponse.data?.results || [],
        totalCount: mcpResponse.data?.totalCount || 0,
        executionTime: mcpResponse.executionTime,
        cached: mcpResponse.cached,
        query,
        requestId: req.requestId,
      });
    } catch (error) {
      console.error(`[${req.requestId}] Content search error:`, error);
      res.status(500).json({
        error: "Content search failed",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: req.requestId,
      });
    }
  }
);

// GET /api/chat/mcp/status - Get MCP system status
router.get("/mcp/status", async (req: Request, res: Response) => {
  try {
    const mcpTest = await contentstackMCP.testMCP();
    const mcpStats = contentstackMCP.getMCPStats();

    res.json({
      status: mcpTest.contentstack ? "healthy" : "degraded",
      components: {
        contentstack: mcpTest.contentstack ? "connected" : "disconnected",
        cache: mcpTest.cache ? "connected" : "disconnected",
        matching: mcpTest.matching ? "operational" : "error",
      },
      stats: mcpStats,
      error: mcpTest.error,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("MCP status check failed:", error);
    res.status(500).json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
});

// DELETE /api/chat/mcp/cache - Clear MCP cache
router.delete("/mcp/cache", async (req: Request, res: Response) => {
  try {
    const cleared = await contentstackMCP.clearContentCache();

    res.json({
      success: cleared,
      message: cleared ? "Cache cleared successfully" : "Failed to clear cache",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cache clear failed:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/chat/models - Get available models (existing endpoint)
router.get("/models", async (req: Request, res: Response) => {
  try {
    const models = await llmService.getAvailableModels();
    const modelInfo = llmService.getModelInfo();

    res.json({
      models,
      current: modelInfo,
      features: {
        contentstack: true,
        streaming: true,
        caching: true,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching models:", error);
    res.status(500).json({
      error: "Failed to fetch models",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/chat/test - Enhanced test endpoint
router.get("/test", async (req: Request, res: Response) => {
  try {
    const stream = req.query.stream === "true";
    const testContent = req.query.contentstack === "true";

    if (stream) {
      streamingService.initializeSSE(res, req.requestId);

      if (testContent) {
        // Test with content search
        try {
          const mcpResponse = await contentstackMCP.searchAndFormatContent(
            "test query"
          );
          const testMessage = mcpResponse.success
            ? `Test streaming with Contentstack integration successful! Found ${
                mcpResponse.data?.results.length || 0
              } results.`
            : "Test streaming successful! (Contentstack not available)";

          const testStream = streamingService.createTestStream(testMessage);
          await streamingService.processLLMStream(
            res,
            req.requestId,
            testStream
          );
        } catch (error) {
          const testStream = streamingService.createTestStream(
            "Test streaming successful! (Contentstack error)"
          );
          await streamingService.processLLMStream(
            res,
            req.requestId,
            testStream
          );
        }
      } else {
        const testStream = streamingService.createTestStream(
          "This is a test streaming response from the TechSurf chat API with MCP!"
        );
        await streamingService.processLLMStream(res, req.requestId, testStream);
      }
    } else {
      let mcpStatus = null;

      if (testContent) {
        try {
          mcpStatus = await contentstackMCP.testMCP();
        } catch (error) {
          mcpStatus = {
            contentstack: false,
            cache: false,
            matching: false,
            error: "MCP test failed",
          };
        }
      }

      res.json({
        message: "Chat API with Contentstack MCP is working correctly!",
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
        streaming: false,
        mcp: mcpStatus,
        features: {
          llm: true,
          streaming: true,
          contentstack: mcpStatus?.contentstack || false,
          caching: mcpStatus?.cache || false,
          semanticSearch: true,
        },
      });
    }
  } catch (error) {
    console.error("Test endpoint error:", error);
    res.status(500).json({
      error: "Test failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/chat/validate - Enhanced validation endpoint
router.post(
  "/validate",
  validate({ body: enhancedChatRequestSchema }),
  (req: Request, res: Response) => {
    res.json({
      valid: true,
      message: "Request validation successful",
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      features: {
        contentstack: req.body.useContentstack,
        contentTypes: req.body.contentTypes,
        maxContextLength: req.body.maxContextLength,
      },
    });
  }
);

export default router;

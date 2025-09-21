import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { llmService } from "../services/llm";
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

const router = Router();

// Middleware for all chat routes
router.use(requestId);
router.use(optionalAuth);
router.use(validateContentType);
router.use(validateRequestSize(1024 * 10)); // 10KB limit

// POST /api/chat - Main chat endpoint with streaming support
router.post(
  "/",
  conditionalRateLimit(chatRateLimit),
  validate({ body: chatRequestSchema, query: chatQuerySchema }),
  async (req: Request, res: Response) => {
    try {
      const { message, conversationId, userId, context, stream } =
        req.body as ChatRequest;
      const shouldStream = stream !== false; // Default to streaming

      console.log(
        `[${req.requestId}] Processing chat request - Stream: ${shouldStream}`
      );

      // Create conversation history
      const messages: ChatMessage[] = [
        {
          id: uuidv4(),
          role: "system",
          content:
            "You are a helpful AI assistant. Provide clear, accurate, and helpful responses.",
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

        // Generate streaming response
        const streamGenerator = (await llmService.generateResponse(
          messages,
          true
        )) as AsyncIterable<string>;
        await streamingService.processLLMStream(
          res,
          req.requestId,
          streamGenerator
        );
      } else {
        // Generate non-streaming response
        const response = (await llmService.generateResponse(
          messages,
          false
        )) as LLMResponse;

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

// POST /api/chat/stream - Dedicated streaming endpoint
router.post(
  "/stream",
  conditionalRateLimit(streamRateLimit),
  validate({ body: chatRequestSchema }),
  async (req: Request, res: Response) => {
    try {
      const { message, conversationId, userId, context } =
        req.body as ChatRequest;

      console.log(`[${req.requestId}] Processing streaming chat request`);

      // Initialize SSE immediately
      streamingService.initializeSSE(res, req.requestId);

      const messages: ChatMessage[] = [
        {
          id: uuidv4(),
          role: "system",
          content:
            "You are a helpful AI assistant. Provide clear, accurate, and helpful responses.",
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
        true
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

// GET /api/chat/models - Get available models
router.get("/models", async (req: Request, res: Response) => {
  try {
    const models = await llmService.getAvailableModels();
    const modelInfo = llmService.getModelInfo();

    res.json({
      models,
      current: modelInfo,
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

// GET /api/chat/test - Test endpoint for development
router.get("/test", async (req: Request, res: Response) => {
  try {
    const stream = req.query.stream === "true";

    if (stream) {
      streamingService.initializeSSE(res, req.requestId);
      const testStream = streamingService.createTestStream(
        "This is a test streaming response from the TechSurf chat API!"
      );
      await streamingService.processLLMStream(res, req.requestId, testStream);
    } else {
      res.json({
        message: "Chat API is working correctly!",
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
        streaming: false,
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

// POST /api/chat/validate - Validate chat request without processing
router.post(
  "/validate",
  validate({ body: chatRequestSchema }),
  (req: Request, res: Response) => {
    res.json({
      valid: true,
      message: "Request validation successful",
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  }
);

export default router;

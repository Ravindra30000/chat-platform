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

// 🧪 CRITICAL: Test endpoint to verify Contentstack integration in LLM (BEFORE MIDDLEWARE)
router.post("/test-contentstack-llm", async (req: Request, res: Response) => {
  try {
    console.log("🧪 TESTING CONTENTSTACK INTEGRATION IN LLM...");

    const testMessages: ChatMessage[] = [
      {
        id: uuidv4(),
        role: "system",
        content:
          "You are a helpful AI assistant with access to a knowledge base.",
        timestamp: new Date(),
      },
      {
        id: uuidv4(),
        role: "user",
        content: "What products do you have available?",
        timestamp: new Date(),
      },
    ];

    console.log("🔍 Testing WITH Contentstack...");
    // Test with Contentstack enabled
    const responseWithCS = (await llmService.generateResponse(
      testMessages,
      false,
      {
        useContentstack: true,
        contentTypes: ["products", "faq", "blog_posts"],
        maxContextLength: 1500,
      }
    )) as LLMResponse;

    console.log("🔍 Testing WITHOUT Contentstack...");
    // Test without Contentstack
    const responseWithoutCS = (await llmService.generateResponse(
      testMessages,
      false,
      {
        useContentstack: false,
      }
    )) as LLMResponse;

    console.log("📊 Comparing responses...");
    console.log("With CS length:", responseWithCS.content.length);
    console.log("Without CS length:", responseWithoutCS.content.length);
    console.log(
      "Content different:",
      responseWithCS.content !== responseWithoutCS.content
    );

    res.json({
      success: true,
      test: {
        withContentstack: {
          content: responseWithCS.content,
          contentLength: responseWithCS.content.length,
          model: responseWithCS.model,
          usage: responseWithCS.usage,
        },
        withoutContentstack: {
          content: responseWithoutCS.content,
          contentLength: responseWithoutCS.content.length,
          model: responseWithoutCS.model,
          usage: responseWithoutCS.usage,
        },
        comparison: {
          lengthDifference:
            responseWithCS.content.length - responseWithoutCS.content.length,
          contentsDifferent:
            responseWithCS.content !== responseWithoutCS.content,
          enhancementDetected:
            responseWithCS.content.toLowerCase().includes("contentstack") ||
            responseWithCS.content.length >
              responseWithoutCS.content.length + 50,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ LLM Contentstack test failed:", error);
    res.status(500).json({
      error: "LLM test failed",
      details: error instanceof Error ? error.message : "Unknown error",
      stack:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.stack
            : undefined
          : undefined,
    });
  }
});

// Middleware for all chat routes
router.use(requestId);
router.use(optionalAuth);
router.use(validateContentType);
router.use(validateRequestSize(1024 * 10)); // 10KB limit

// POST /api/chat/debug - Enhanced debug endpoint (MOVED TO TOP)
router.post("/debug", async (req: Request, res: Response) => {
  console.log(
    "🔍 DEBUG - Raw request body:",
    JSON.stringify(req.body, null, 2)
  );
  console.log("🔍 DEBUG - Request headers:", req.headers);
  console.log("🔍 DEBUG - Content-Type:", req.get("Content-Type"));

  try {
    // Test the validation schema
    const validationResult = enhancedChatRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      console.log(
        "❌ DEBUG - Validation failed:",
        validationResult.error.errors
      );
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.errors,
        receivedData: req.body,
      });
    }

    console.log("✅ DEBUG - Validation passed:", validationResult.data);
    res.json({
      success: true,
      message: "Debug validation passed",
      validatedData: validationResult.data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ DEBUG - Error:", error);
    res.status(500).json({
      error: "Debug endpoint error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/chat/contentstack-debug - Comprehensive Contentstack debug endpoint
router.get("/contentstack-debug", async (req: Request, res: Response) => {
  try {
    console.log("🔍 CONTENTSTACK DEBUG - Starting comprehensive debug...");

    // Step 1: Test MCP Status
    console.log("📋 Step 1: Testing MCP status...");
    const mcpStatus = await contentstackMCP.testMCP();
    console.log("📋 MCP Status:", mcpStatus);

    // Step 2: Get available content types
    console.log("📋 Step 2: Getting available content types...");
    const contentTypes = await contentstackMCP.getAvailableContentTypes();
    console.log("📋 Available content types:", contentTypes);

    // Step 3: Test different search queries
    console.log("🔍 Step 3: Testing various search queries...");

    const searchTests = [];

    // Test 1: General product search
    console.log('🔍 Test 1: Searching for "products"...');
    const productSearch = await contentstackMCP.searchAndFormatContent(
      "products",
      {
        contentTypes: [],
        maxResults: 5,
        useCache: false,
      }
    );
    console.log("🔍 Product search results:", productSearch);
    searchTests.push({ query: "products", results: productSearch });

    // Test 2: Blog search
    console.log('🔍 Test 2: Searching for "blog"...');
    const blogSearch = await contentstackMCP.searchAndFormatContent("blog", {
      contentTypes: [],
      maxResults: 5,
      useCache: false,
    });
    console.log("🔍 Blog search results:", blogSearch);
    searchTests.push({ query: "blog", results: blogSearch });

    // Test 3: FAQ search
    console.log('🔍 Test 3: Searching for "FAQ"...');
    const faqSearch = await contentstackMCP.searchAndFormatContent("FAQ", {
      contentTypes: [],
      maxResults: 5,
      useCache: false,
    });
    console.log("🔍 FAQ search results:", faqSearch);
    searchTests.push({ query: "FAQ", results: faqSearch });

    // Test 4: Empty query (should return recent content)
    console.log("🔍 Test 4: Searching with empty query...");
    const emptySearch = await contentstackMCP.searchAndFormatContent("", {
      contentTypes: [],
      maxResults: 10,
      useCache: false,
    });
    console.log("🔍 Empty search results:", emptySearch);
    searchTests.push({ query: "(empty)", results: emptySearch });

    // Test 5: Search with specific content types
    if (contentTypes.length > 0) {
      console.log("🔍 Test 5: Searching with specific content types...");
      const specificSearch = await contentstackMCP.searchAndFormatContent(
        "test",
        {
          contentTypes: [contentTypes[0]], // Use first available content type
          maxResults: 5,
          useCache: false,
        }
      );
      console.log("🔍 Specific content type search results:", specificSearch);
      searchTests.push({
        query: `test (${contentTypes[0]})`,
        results: specificSearch,
      });
    }

    // Step 4: Get MCP stats
    console.log("📊 Step 4: Getting MCP statistics...");
    const mcpStats = contentstackMCP.getMCPStats();
    console.log("📊 MCP Stats:", mcpStats);

    res.json({
      success: true,
      debug: {
        mcpStatus: mcpStatus,
        contentTypes: contentTypes,
        contentTypeCount: contentTypes.length,
        searchTests: searchTests,
        mcpStats: mcpStats,
        timestamp: new Date().toISOString(),
        environment: process.env.CONTENTSTACK_ENVIRONMENT,
        region: process.env.CONTENTSTACK_REGION,
      },
    });
  } catch (error) {
    console.error("❌ Contentstack debug error:", error);
    res.status(500).json({
      error: "Contentstack debug failed",
      details: error instanceof Error ? error.message : "Unknown error",
      stack:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.stack
            : undefined
          : undefined,
    });
  }
});

// GET /api/chat/contentstack-raw - Raw Contentstack API test
router.get("/contentstack-raw", async (req: Request, res: Response) => {
  try {
    console.log("🔍 RAW CONTENTSTACK TEST - Direct API calls...");

    const results = {
      contentTypes: null,
      entries: null,
      errors: [],
    };

    // Direct Contentstack API calls (you'll need to import the client)
    try {
      // Test content types call
      console.log("📋 Testing direct content types API call...");
      // You may need to adjust this based on your contentstack client implementation
      results.contentTypes = await contentstackMCP.getAvailableContentTypes();
    } catch (error) {
      console.error("❌ Content types error:", error);
      results.errors.push(
        `Content types: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    res.json({
      success: results.errors.length === 0,
      results: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Raw Contentstack test error:", error);
    res.status(500).json({
      error: "Raw Contentstack test failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 🧪 CRITICAL: Test endpoint to verify Contentstack integration in LLM
router.post("/test-contentstack-llm", async (req: Request, res: Response) => {
  try {
    console.log("🧪 TESTING CONTENTSTACK INTEGRATION IN LLM...");

    const testMessages: ChatMessage[] = [
      {
        id: uuidv4(),
        role: "system",
        content:
          "You are a helpful AI assistant with access to a knowledge base.",
        timestamp: new Date(),
      },
      {
        id: uuidv4(),
        role: "user",
        content: "What products do you have available?",
        timestamp: new Date(),
      },
    ];

    console.log("🔍 Testing WITH Contentstack...");
    // Test with Contentstack enabled
    const responseWithCS = (await llmService.generateResponse(
      testMessages,
      false,
      {
        useContentstack: true,
        contentTypes: ["products", "faq", "blog_posts"],
        maxContextLength: 1500,
      }
    )) as LLMResponse;

    console.log("🔍 Testing WITHOUT Contentstack...");
    // Test without Contentstack
    const responseWithoutCS = (await llmService.generateResponse(
      testMessages,
      false,
      {
        useContentstack: false,
      }
    )) as LLMResponse;

    console.log("📊 Comparing responses...");
    console.log("With CS length:", responseWithCS.content.length);
    console.log("Without CS length:", responseWithoutCS.content.length);
    console.log(
      "Content different:",
      responseWithCS.content !== responseWithoutCS.content
    );

    res.json({
      success: true,
      test: {
        withContentstack: {
          content: responseWithCS.content,
          contentLength: responseWithCS.content.length,
          model: responseWithCS.model,
          usage: responseWithCS.usage,
        },
        withoutContentstack: {
          content: responseWithoutCS.content,
          contentLength: responseWithoutCS.content.length,
          model: responseWithoutCS.model,
          usage: responseWithoutCS.usage,
        },
        comparison: {
          lengthDifference:
            responseWithCS.content.length - responseWithoutCS.content.length,
          contentsDifferent:
            responseWithCS.content !== responseWithoutCS.content,
          enhancementDetected:
            responseWithCS.content.toLowerCase().includes("contentstack") ||
            responseWithCS.content.length >
              responseWithoutCS.content.length + 50,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ LLM Contentstack test failed:", error);
    res.status(500).json({
      error: "LLM test failed",
      details: error instanceof Error ? error.message : "Unknown error",
      stack:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.stack
            : undefined
          : undefined,
    });
  }
});

// 🔍 Enhanced endpoint to test actual content retrieval
router.post("/test-content-retrieval", async (req: Request, res: Response) => {
  try {
    console.log("🔍 TESTING CONTENT RETRIEVAL...");

    const { query = "products" } = req.body;

    // Step 1: Test direct content search
    console.log(`🔍 Step 1: Direct content search for "${query}"...`);
    const contentSearch = await contentstackMCP.searchAndFormatContent(query, {
      contentTypes: [],
      maxResults: 10,
      useCache: false,
    });

    console.log("📋 Content search result:", {
      success: contentSearch.success,
      resultCount: contentSearch.data?.results?.length || 0,
      hasData: !!(
        contentSearch.data?.results && contentSearch.data.results.length > 0
      ),
    });

    // Step 2: Test if content exists but isn't being found
    console.log("🔍 Step 2: Testing with different queries...");
    const testQueries = ["product", "blog", "faq", "help", ""];
    const queryResults = [];

    for (const testQuery of testQueries) {
      const result = await contentstackMCP.searchAndFormatContent(testQuery, {
        contentTypes: [],
        maxResults: 5,
        useCache: false,
      });
      queryResults.push({
        query: testQuery,
        success: result.success,
        resultCount: result.data?.results?.length || 0,
        executionTime: result.executionTime,
      });
    }

    res.json({
      success: true,
      originalQuery: query,
      mainSearch: contentSearch,
      testQueries: queryResults,
      summary: {
        anyResultsFound: queryResults.some((r) => r.resultCount > 0),
        totalResultsAcrossQueries: queryResults.reduce(
          (sum, r) => sum + r.resultCount,
          0
        ),
        recommendedAction: queryResults.every((r) => r.resultCount === 0)
          ? "CHECK_CONTENTSTACK_ENTRIES"
          : "CHECK_QUERY_MATCHING",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Content retrieval test failed:", error);
    res.status(500).json({
      error: "Content retrieval test failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/chat - Main chat endpoint with ENHANCED CONTENTSTACK LOGGING
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
        `[${req.requestId}] 🚀 Processing chat request - Stream: ${shouldStream}, Contentstack: ${useContentstack}`
      );

      // Enhanced logging for Contentstack options
      if (useContentstack) {
        console.log(
          `[${req.requestId}] 🧠 Contentstack enabled with options:`,
          {
            contentTypes: contentTypes || [],
            maxContextLength: maxContextLength || "default",
            message: message.substring(0, 50) + "...",
          }
        );

        // 🔍 PRE-FLIGHT TEST: Check if content exists for this query
        console.log(
          `[${req.requestId}] 🔍 PRE-FLIGHT: Testing content search for message...`
        );
        const preflightSearch = await contentstackMCP.searchAndFormatContent(
          message,
          {
            contentTypes: contentTypes || [],
            maxResults: 3,
            useCache: false,
          }
        );
        console.log(`[${req.requestId}] 📋 PRE-FLIGHT RESULT:`, {
          success: preflightSearch.success,
          resultCount: preflightSearch.data?.results?.length || 0,
          hasContent: !!(
            preflightSearch.data?.results &&
            preflightSearch.data.results.length > 0
          ),
        });

        if (
          preflightSearch.data?.results &&
          preflightSearch.data.results.length > 0
        ) {
          console.log(
            `[${req.requestId}] ✅ CONTENT FOUND - LLM should be enhanced`
          );
          console.log(
            `[${req.requestId}] 📄 Sample content:`,
            preflightSearch.data.results[0]
          );
        } else {
          console.log(
            `[${req.requestId}] ⚠️ NO CONTENT FOUND - LLM will respond generically`
          );
        }
      }

      // Create conversation history
      const messages: ChatMessage[] = [
        {
          id: uuidv4(),
          role: "system",
          content: useContentstack
            ? "You are a helpful AI assistant with access to a knowledge base. Use the provided content to give accurate, specific answers. If no relevant content is provided, say so clearly."
            : "You are a helpful AI assistant. Provide clear, accurate, and helpful responses based on your training data.",
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

      console.log(
        `[${req.requestId}] 🤖 Calling LLM service with Contentstack: ${useContentstack}`
      );

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

        console.log(
          `[${req.requestId}] 📤 LLM Response received - Length: ${response.content.length}`
        );
        console.log(
          `[${req.requestId}] 🧠 Response preview:`,
          response.content.substring(0, 150) + "..."
        );

        // 🔍 POST-FLIGHT: Analyze if response seems enhanced
        const responseAnalysis = {
          mentionsProducts: response.content.toLowerCase().includes("product"),
          mentionsSpecifics: /\b(laptop|phone|tablet|price|\$\d+)\b/i.test(
            response.content
          ),
          isLongEnough: response.content.length > 200,
          seemsGeneric:
            response.content.toLowerCase().includes("i don't have") ||
            response.content.toLowerCase().includes("cannot provide") ||
            response.content.toLowerCase().includes("not able to"),
        };

        console.log(
          `[${req.requestId}] 📊 RESPONSE ANALYSIS:`,
          responseAnalysis
        );

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
          debug: {
            responseAnalysis,
            contentSearchAttempted: useContentstack,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error(`[${req.requestId}] ❌ Chat error:`, error);

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
    console.log("📋 Fetching available content types...");
    const contentTypes = await contentstackMCP.getAvailableContentTypes();
    console.log("📋 Content types fetched:", contentTypes);

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

// POST /api/chat/search-content - Direct content search endpoint with enhanced logging
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

      console.log(`[${req.requestId}] 🔍 Content search request:`, {
        query,
        contentTypes: contentTypes || [],
        maxResults,
        useCache,
      });

      const mcpResponse = await contentstackMCP.searchAndFormatContent(query, {
        contentTypes,
        maxResults,
        useCache,
      });

      console.log(`[${req.requestId}] 📋 Content search response:`, {
        success: mcpResponse.success,
        resultCount: mcpResponse.data?.results?.length || 0,
        totalCount: mcpResponse.data?.totalCount || 0,
        executionTime: mcpResponse.executionTime,
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

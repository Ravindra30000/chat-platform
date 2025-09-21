import { Response } from "express";
import { StreamChunk } from "../types";

export class StreamingService {
  private static instance: StreamingService;

  private constructor() {}

  static getInstance(): StreamingService {
    if (!StreamingService.instance) {
      StreamingService.instance = new StreamingService();
    }
    return StreamingService.instance;
  }

  // Initialize Server-Sent Events response
  initializeSSE(res: Response, requestId: string): void {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
      "X-Request-ID": requestId,
    });

    // Send initial connection confirmation
    this.sendSSEData(res, {
      id: requestId,
      type: "content",
      content: "",
      metadata: { connected: true, timestamp: new Date().toISOString() },
    });

    // Keep connection alive
    const keepAlive = setInterval(() => {
      this.sendKeepAlive(res);
    }, 30000); // Every 30 seconds

    // Clean up on client disconnect
    res.on("close", () => {
      clearInterval(keepAlive);
    });
  }

  // Send data through Server-Sent Events
  sendSSEData(res: Response, chunk: StreamChunk): void {
    try {
      const data = JSON.stringify(chunk);
      res.write(`id: ${chunk.id}\n`);
      res.write(`event: message\n`);
      res.write(`data: ${data}\n\n`);
    } catch (error) {
      console.error("Failed to send SSE data:", error);
      this.sendSSEError(res, chunk.id, "Failed to send data");
    }
  }

  // Send content chunk
  sendContent(
    res: Response,
    id: string,
    content: string,
    metadata?: Record<string, unknown>
  ): void {
    this.sendSSEData(res, {
      id,
      type: "content",
      content,
      metadata,
    });
  }

  // Send completion signal
  sendComplete(
    res: Response,
    id: string,
    metadata?: Record<string, unknown>
  ): void {
    this.sendSSEData(res, {
      id,
      type: "done",
      metadata: {
        ...metadata,
        completed: true,
        timestamp: new Date().toISOString(),
      },
    });

    // Close the connection after sending complete signal
    setTimeout(() => {
      res.end();
    }, 100);
  }

  // Send error through stream
  sendSSEError(
    res: Response,
    id: string,
    error: string,
    metadata?: Record<string, unknown>
  ): void {
    this.sendSSEData(res, {
      id,
      type: "error",
      error,
      metadata: {
        ...metadata,
        error: true,
        timestamp: new Date().toISOString(),
      },
    });

    // Close the connection after error
    setTimeout(() => {
      res.end();
    }, 100);
  }

  // Send keep-alive ping
  private sendKeepAlive(res: Response): void {
    try {
      res.write(": keep-alive\n\n");
    } catch (error) {
      console.error("Failed to send keep-alive:", error);
    }
  }

  // Process streaming content from LLM
  async processLLMStream(
    res: Response,
    requestId: string,
    streamGenerator: AsyncIterable<string>
  ): Promise<void> {
    try {
      let fullContent = "";

      for await (const chunk of streamGenerator) {
        fullContent += chunk;

        // Send each chunk as it comes
        this.sendContent(res, requestId, chunk, {
          chunkIndex: fullContent.length,
          timestamp: new Date().toISOString(),
        });
      }

      // Send completion signal with full content
      this.sendComplete(res, requestId, {
        fullContent,
        totalChunks: fullContent.length,
        completed: true,
      });
    } catch (error) {
      console.error("Error processing LLM stream:", error);
      this.sendSSEError(
        res,
        requestId,
        error instanceof Error ? error.message : "Stream processing error"
      );
    }
  }

  // Handle streaming for regular HTTP response (non-SSE)
  async processRegularStream(
    res: Response,
    requestId: string,
    streamGenerator: AsyncIterable<string>
  ): Promise<void> {
    try {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("X-Request-ID", requestId);

      let fullContent = "";

      for await (const chunk of streamGenerator) {
        fullContent += chunk;
      }

      res.json({
        id: requestId,
        content: fullContent,
        timestamp: new Date().toISOString(),
        streaming: false,
      });
    } catch (error) {
      console.error("Error processing regular stream:", error);
      res.status(500).json({
        error: "Stream processing error",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId,
      });
    }
  }

  // Validate if client accepts SSE
  clientSupportsSSE(req: any): boolean {
    const acceptHeader = req.headers.accept || "";
    return (
      acceptHeader.includes("text/event-stream") ||
      acceptHeader.includes("*/*") ||
      req.query.stream === "true"
    );
  }

  // Create a simple text stream for testing
  async *createTestStream(
    message: string = "Hello, World!"
  ): AsyncIterable<string> {
    const words = message.split(" ");

    for (let i = 0; i < words.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 200)); // Simulate delay
      yield i === 0 ? words[i] : ` ${words[i]}`;
    }
  }
}

// Export singleton instance
export const streamingService = StreamingService.getInstance();

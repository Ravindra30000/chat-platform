// src/services/chatApi.ts
import { ChatApiRequest, ApiChatResponse, StreamChunk } from "../types";

export class ChatApiService {
  private apiUrl: string;
  private defaultHeaders: HeadersInit;

  constructor(apiUrl: string) {
    // Remove trailing slash to match your existing API structure
    this.apiUrl = apiUrl.replace(/\/$/, "");
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  // Test connection to the API
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        method: "GET",
        headers: this.defaultHeaders,
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Health check failed: ${response.status} ${response.statusText}`,
        };
      }

      const health = await response.json();
      return {
        success: health.status === "healthy" || health.status === "degraded",
        error: health.status !== "healthy" ? health.error : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }

  // Send streaming chat message (matches your /api/chat endpoint)
  async sendStreamingMessage(request: ChatApiRequest): Promise<Response> {
    const response = await fetch(`${this.apiUrl}/api/chat`, {
      method: "POST",
      headers: {
        ...this.defaultHeaders,
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        ...request,
        stream: true, // Force streaming
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }

  // Send non-streaming chat message
  async sendMessage(request: ChatApiRequest): Promise<ApiChatResponse> {
    const response = await fetch(`${this.apiUrl}/api/chat`, {
      method: "POST",
      headers: this.defaultHeaders,
      body: JSON.stringify({
        ...request,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  // Process Server-Sent Events stream (matches your streaming format)
  async *processStreamingResponse(
    response: Response
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("No response body reader available");
    }

    try {
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();

          if (trimmedLine.startsWith("data: ")) {
            const data = trimmedLine.slice(6);

            if (data === "[DONE]") {
              return;
            }

            try {
              const parsed: StreamChunk = JSON.parse(data);
              yield parsed;
            } catch (e) {
              console.warn("Failed to parse SSE data:", data, e);
              // Continue processing other chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // Get available models (matches your /api/chat/models endpoint)
  async getAvailableModels(): Promise<{
    models: string[];
    current: { name: string; description: string; maxTokens: number };
    features: Record<string, boolean>;
  }> {
    const response = await fetch(`${this.apiUrl}/api/chat/models`, {
      method: "GET",
      headers: this.defaultHeaders,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    return response.json();
  }

  // Test the API connection (matches your /api/chat/test endpoint)
  async testChat(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/api/chat/test`, {
        method: "GET",
        headers: this.defaultHeaders,
      });

      if (!response.ok) {
        return { success: false, message: `Test failed: ${response.status}` };
      }

      const result = await response.json();
      return {
        success: true,
        message: result.message || "Test successful",
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Test failed",
      };
    }
  }

  // Get content types (if Contentstack is enabled)
  async getContentTypes(): Promise<string[]> {
    try {
      const response = await fetch(`${this.apiUrl}/api/chat/content-types`, {
        method: "GET",
        headers: this.defaultHeaders,
      });

      if (!response.ok) {
        return [];
      }

      const result = await response.json();
      return result.contentTypes || [];
    } catch (error) {
      console.warn("Failed to fetch content types:", error);
      return [];
    }
  }
}

import Groq from "groq-sdk";
import { config } from "../config/env";
import { LLMResponse, ChatMessage } from "../types";

export class LLMService {
  private groq: Groq;
  private readonly model = "llama-3.1-8b-instant"; // ✅ UPDATED: Use supported model

  constructor() {
    this.groq = new Groq({
      apiKey: config.groqApiKey,
    });
  }

  async generateResponse(
    messages: ChatMessage[],
    stream: boolean = false,
    options: {
      useContentstack?: boolean;
      contentTypes?: string[];
      maxContextLength?: number;
    } = {}
  ): Promise<LLMResponse | AsyncIterable<string>> {
    try {
      let processedMessages = messages;

      console.log('🔍 LLM Service - useContentstack:', options?.useContentstack);
console.log('🔍 LLM Service - contentTypes:', options?.contentTypes);

if (options?.useContentstack) {
  console.log('🧠 Attempting to enhance with Contentstack...');
  // Your Contentstack integration code
}
      // Note: Contentstack enhancement disabled for now to avoid errors
      // This can be re-enabled once MCP services are properly configured

      const groqMessages = this.formatMessagesForGroq(processedMessages);

      if (stream) {
        return this.createStreamingResponse(groqMessages);
      } else {
        return this.createResponse(groqMessages);
      }
    } catch (error) {
      console.error("LLM service error:", error);
      throw new Error(
        `Failed to generate response: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async createResponse(messages: any[]): Promise<LLMResponse> {
    const completion = await this.groq.chat.completions.create({
      messages,
      model: this.model,
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      stream: false,
    });

    const choice = completion.choices[0];
    if (!choice?.message?.content) {
      throw new Error("No response generated from LLM");
    }

    return {
      content: choice.message.content,
      usage: completion.usage
        ? {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
            totalTokens: completion.usage.total_tokens,
          }
        : undefined,
      model: completion.model,
      finishReason: choice.finish_reason || undefined,
    };
  }

  private async createStreamingResponse(
    messages: any[]
  ): Promise<AsyncIterable<string>> {
    const stream = await this.groq.chat.completions.create({
      messages,
      model: this.model,
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      stream: true,
    });

    return this.processGroqStream(stream);
  }

  private async *processGroqStream(stream: any): AsyncIterable<string> {
    try {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          yield delta.content;
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      throw new Error(
        `Streaming failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private formatMessagesForGroq(messages: ChatMessage[]): any[] {
    return messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));
  }

  async validateConnection(): Promise<boolean> {
    try {
      const testResponse = await this.groq.chat.completions.create({
        messages: [{ role: "user", content: "Test connection" }],
        model: this.model,
        max_tokens: 5,
        temperature: 0,
        stream: false,
      });

      return testResponse.choices.length > 0;
    } catch (error) {
      console.error("LLM connection validation failed:", error);
      return false;
    }
  }

  // Get available models - UPDATED with working models
  async getAvailableModels(): Promise<string[]> {
    try {
      return [
        "llama-3.1-8b-instant", // ✅ PRIMARY MODEL (fast and reliable)
        "llama-3.2-1b-preview",
        "llama-3.2-3b-preview",
        "mixtral-8x7b-32768",
        "gemma-7b-it",
        "gemma2-9b-it",
      ];
    } catch (error) {
      console.error("Failed to get available models:", error);
      return [this.model];
    }
  }

  // Check API key validity
  async checkApiKeyValidity(): Promise<{ valid: boolean; error?: string }> {
    try {
      await this.validateConnection();
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Get model information - UPDATED
  getModelInfo(): { name: string; description: string; maxTokens: number } {
    return {
      name: this.model,
      description: "Llama 3.1 8B Instant - Fast and reliable language model",
      maxTokens: 8192,
    };
  }
}

// Export singleton instance
export const llmService = new LLMService();

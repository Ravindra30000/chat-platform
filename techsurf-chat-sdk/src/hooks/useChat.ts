// src/hooks/useChat.ts
import { useState, useCallback, useRef, useEffect } from "react";
import { ChatState, Message, ChatApiRequest } from "../types";
import { ChatApiService } from "../services/chatApi";

export const useChat = (
  apiUrl: string,
  options?: {
    agentId?: string | undefined;
    useContentstack?: boolean | undefined;
    contentTypes?: string[] | undefined;
    maxContextLength?: number | undefined;
    userId?: string | undefined;
  }
) => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    isConnected: false,
    error: null,
    conversationId: null,
  });

  const chatApiRef = useRef(new ChatApiService(apiUrl));
  const abortControllerRef = useRef<AbortController | null>(null);
  const connectionTestedRef = useRef(false);

  // Test connection on mount
  useEffect(() => {
    const testConnection = async () => {
      if (connectionTestedRef.current) return;

      try {
        connectionTestedRef.current = true;
        const result = await chatApiRef.current.testConnection();

        setState((prev) => ({
          ...prev,
          isConnected: result.success,
          error: result.success ? null : result.error || "Connection failed",
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isConnected: false,
          error:
            error instanceof Error ? error.message : "Connection test failed",
        }));
      }
    };

    testConnection();
  }, []);

  const sendMessage = useCallback(
    async (content: string, streaming: boolean = true) => {
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const userMessage: Message = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content,
        role: "user",
        timestamp: new Date(),
        metadata: options?.userId
          ? {
              userId: options.userId,
            }
          : undefined,
      };

      // Add user message
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isLoading: true,
        error: null,
      }));

      try {
        const request: ChatApiRequest = {
          message: content,
          conversationId: state.conversationId || undefined,
          userId: options?.userId || undefined,
          stream: streaming,
          useContentstack: options?.useContentstack || undefined,
          contentTypes: options?.contentTypes || undefined,
          maxContextLength: options?.maxContextLength || undefined,
        };

        if (streaming) {
          // Handle streaming response
          const response = await chatApiRef.current.sendStreamingMessage(
            request
          );

          let assistantMessage: Message = {
            id: `assistant-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            content: "",
            role: "assistant",
            timestamp: new Date(),
            metadata: {},
          };

          // Add assistant message placeholder
          setState((prev) => ({
            ...prev,
            messages: [...prev.messages, assistantMessage],
            isConnected: true,
          }));

          // Process streaming chunks
          for await (const chunk of chatApiRef.current.processStreamingResponse(
            response
          )) {
            if (chunk.type === "content" && chunk.content) {
              assistantMessage = {
                ...assistantMessage,
                content: assistantMessage.content + chunk.content,
              };

              setState((prev) => ({
                ...prev,
                messages: [...prev.messages.slice(0, -1), assistantMessage],
              }));
            } else if (chunk.type === "done") {
              // Final update with complete content
              if (chunk.metadata.fullContent) {
                assistantMessage = {
                  ...assistantMessage,
                  content: chunk.metadata.fullContent,
                  timestamp: new Date(chunk.metadata.timestamp),
                };

                setState((prev) => ({
                  ...prev,
                  messages: [...prev.messages.slice(0, -1), assistantMessage],
                  conversationId: prev.conversationId || `conv-${Date.now()}`,
                }));
              }
              break;
            } else if (chunk.type === "error") {
              throw new Error(chunk.error || "Streaming error occurred");
            }
          }
        } else {
          // Handle non-streaming response
          const response = await chatApiRef.current.sendMessage(request);

          const assistantMessage: Message = {
            id: response.message.id,
            content: response.message.content,
            role: response.message.role,
            timestamp: new Date(response.message.timestamp),
            metadata: {
              contentEnhanced: response.enhancedWithContent,
            },
          };

          setState((prev) => ({
            ...prev,
            messages: [...prev.messages, assistantMessage],
            conversationId: response.conversationId,
            isConnected: true,
          }));
        }
      } catch (error) {
        console.error("Chat error:", error);
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "An error occurred while sending the message",
          isConnected: false,
        }));
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
        abortControllerRef.current = null;
      }
    },
    [options, state.conversationId]
  );

  const clearMessages = useCallback(() => {
    setState((prev) => ({
      ...prev,
      messages: [],
      conversationId: null,
      error: null,
    }));
  }, []);

  const retry = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const reconnect = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await chatApiRef.current.testConnection();
      setState((prev) => ({
        ...prev,
        isConnected: result.success,
        error: result.success ? null : result.error || "Reconnection failed",
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isConnected: false,
        error: error instanceof Error ? error.message : "Reconnection failed",
        isLoading: false,
      }));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    sendMessage,
    clearMessages,
    retry,
    reconnect,
  };
};

// src/components/MessageList.tsx
import React, { useEffect, useRef } from "react";
import { Message } from "../types";
import { MessageBubble } from "./MessageBubble";
import { LoadingIndicator } from "./LoadingIndicator";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
  showTimestamps?: boolean;
  emptyStateMessage?: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  error,
  onRetry,
  showTimestamps = true,
  emptyStateMessage = "Start a conversation with your AI assistant!",
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  };

  useEffect(() => {
    // Scroll to bottom when new messages arrive or loading state changes
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [messages.length, isLoading]);

  // Filter out system messages for display
  const displayMessages = messages.filter((msg) => msg.role !== "system");

  return (
    <div className="techsurf-message-list" ref={containerRef}>
      <div className="techsurf-messages-container">
        {displayMessages.length === 0 && !isLoading && !error && (
          <div className="techsurf-empty-state">
            <div className="techsurf-empty-icon">💬</div>
            <p className="techsurf-empty-message">{emptyStateMessage}</p>
          </div>
        )}

        {displayMessages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            isStreaming={
              isLoading &&
              message.role === "assistant" &&
              index === displayMessages.length - 1
            }
            showTimestamp={showTimestamps}
          />
        ))}

        {isLoading &&
          displayMessages.length > 0 &&
          displayMessages[displayMessages.length - 1]?.role === "user" && (
            <LoadingIndicator message="AI is responding..." />
          )}

        {error && (
          <div className="techsurf-error-message">
            <div className="techsurf-error-content">
              <span className="techsurf-error-icon">⚠️</span>
              <span className="techsurf-error-text">{error}</span>
            </div>
            {onRetry && (
              <button
                className="techsurf-retry-button"
                onClick={onRetry}
                type="button"
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
};

// src/components/MessageBubble.tsx
import React from "react";
import { Message } from "../types";

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  showTimestamp?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isStreaming = false,
  showTimestamp = true,
}) => {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  // Don't render system messages in the UI
  if (isSystem) return null;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const messageClasses = [
    "techsurf-message-bubble",
    isUser ? "techsurf-user-message" : "techsurf-assistant-message",
    isStreaming ? "techsurf-streaming" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={messageClasses}>
      <div className="techsurf-message-content">
        <div className="techsurf-message-text">
          {message.content}
          {isStreaming && <span className="techsurf-cursor">|</span>}
        </div>
        {message.metadata?.contentEnhanced && (
          <div
            className="techsurf-content-badge"
            title="Enhanced with knowledge base"
          >
            🧠 Enhanced
          </div>
        )}
      </div>
      {showTimestamp && (
        <div className="techsurf-message-timestamp">
          {formatTime(message.timestamp)}
        </div>
      )}
    </div>
  );
};

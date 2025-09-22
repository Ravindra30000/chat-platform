// src/ChatWidget.tsx
import React, { useState, useEffect, useCallback } from "react";
import { ChatWidgetProps } from "./types";
import { useChat } from "./hooks/useChat";
import { useTheme } from "./hooks/useTheme";
import { ChatHeader } from "./components/ChatHeader";
import { MessageList } from "./components/MessageList";
import { ChatInput } from "./components/ChatInput";

// Declare process for environment check
declare const process: {
  env: {
    NODE_ENV: string;
  };
};

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  apiUrl,
  agentId,
  theme,
  title = "AI Assistant",
  placeholder = "Type your message...",
  height = "500px",
  width = "380px",
  position = "bottom-right",
  minimized = false,
  useContentstack = true,
  contentTypes = [],
  maxContextLength = 2000,
  onMessage,
  onError,
  onConnect,
  onDisconnect,
}) => {
  const [isMinimized, setIsMinimized] = useState(minimized);
  const [isVisible, setIsVisible] = useState(!minimized);
  const [hasInteracted, setHasInteracted] = useState(false);

  const chatOptions = {
    agentId: agentId || undefined,
    useContentstack: useContentstack || undefined,
    contentTypes: contentTypes || undefined,
    maxContextLength: maxContextLength || undefined,
    userId: `user-${Date.now()}`, // Simple user ID generation
  };

  const {
    messages,
    isLoading,
    isConnected,
    error,
    sendMessage,
    retry,
    reconnect,
  } = useChat(apiUrl, chatOptions);

  const { cssVariables } = useTheme(theme);

  // Handle message callback
  useEffect(() => {
    if (onMessage && messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      // Only call for assistant messages to avoid echoing user input
      if (latestMessage && latestMessage.role === "assistant") {
        onMessage(latestMessage);
      }
    }
  }, [messages, onMessage]);

  // Handle error callback
  useEffect(() => {
    if (onError && error) {
      onError(new Error(error));
    }
  }, [error, onError]);

  // Handle connection callbacks
  useEffect(() => {
    if (isConnected && onConnect) {
      onConnect();
    } else if (!isConnected && hasInteracted && onDisconnect) {
      onDisconnect();
    }
  }, [isConnected, onConnect, onDisconnect, hasInteracted]);

  const handleMinimize = useCallback(() => {
    setIsMinimized(!isMinimized);
  }, [isMinimized]);

  const handleToggleVisibility = useCallback(() => {
    setIsVisible(!isVisible);
    if (!isVisible) {
      setIsMinimized(false);
    }
  }, [isVisible]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      setHasInteracted(true);
      await sendMessage(content, true); // Always use streaming
    },
    [sendMessage]
  );

  const handleRetry = useCallback(() => {
    retry();
    if (!isConnected) {
      reconnect();
    }
  }, [retry, reconnect, isConnected]);

  const getPositionClasses = () => {
    switch (position) {
      case "bottom-left":
        return "techsurf-position-bottom-left";
      case "center":
        return "techsurf-position-center";
      default:
        return "techsurf-position-bottom-right";
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC to minimize (only when chat is focused)
      if (e.key === "Escape" && isVisible && !isMinimized) {
        const activeElement = document.activeElement;
        const chatElement = document.querySelector(".techsurf-chat-widget");

        if (chatElement?.contains(activeElement)) {
          setIsMinimized(true);
        }
      }
    };

    if (isVisible) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isVisible, isMinimized]);

  return (
    <div
      className={`techsurf-chat-widget-container ${getPositionClasses()}`}
      style={cssVariables}
    >
      {/* Chat Trigger Button */}
      {!isVisible && (
        <button
          className="techsurf-chat-trigger-button"
          onClick={handleToggleVisibility}
          aria-label={`Open ${title}`}
          type="button"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="techsurf-chat-icon"
            aria-hidden="true"
          >
            <path d="21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>

          {/* Notification badge for connection issues */}
          {!isConnected && hasInteracted && (
            <div
              className="techsurf-notification-badge"
              aria-label="Connection issue"
            >
              !
            </div>
          )}
        </button>
      )}

      {/* Chat Widget */}
      {isVisible && (
        <div
          className={`techsurf-chat-widget ${
            isMinimized ? "techsurf-minimized" : ""
          }`}
          style={{
            height: isMinimized ? "auto" : height,
            width: width,
          }}
          role="dialog"
          aria-labelledby="techsurf-chat-title"
        >
          <ChatHeader
            title={title}
            subtitle={
              useContentstack ? "Enhanced with knowledge base" : undefined
            }
            onMinimize={handleMinimize}
            onClose={handleToggleVisibility}
            isConnected={isConnected}
            isLoading={isLoading && !hasInteracted}
            showConnectionStatus={hasInteracted}
          />

          {!isMinimized && (
            <>
              <MessageList
                messages={messages}
                isLoading={isLoading}
                error={error}
                onRetry={handleRetry}
                emptyStateMessage={`Hi! I'm your ${title.toLowerCase()}. ${
                  useContentstack
                    ? "I have access to our knowledge base to provide accurate information."
                    : "How can I help you today?"
                }`}
              />

              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={isLoading || (!isConnected && hasInteracted)}
                placeholder={
                  !isConnected && hasInteracted
                    ? "Reconnecting..."
                    : placeholder
                }
                maxLength={2000}
              />

              {/* Debug info in development */}
              {typeof process !== "undefined" &&
                process.env?.NODE_ENV === "development" && (
                  <div className="techsurf-debug-info">
                    <small>
                      Connected: {isConnected ? "✓" : "✗"} | Content:{" "}
                      {useContentstack ? "✓" : "✗"} | Messages:{" "}
                      {messages.length}
                    </small>
                  </div>
                )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Default export for easier importing
export default ChatWidget;

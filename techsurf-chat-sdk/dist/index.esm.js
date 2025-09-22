var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
class ChatApiService {
  constructor(apiUrl) {
    __publicField(this, "apiUrl");
    __publicField(this, "defaultHeaders");
    this.apiUrl = apiUrl.replace(/\/$/, "");
    this.defaultHeaders = {
      "Content-Type": "application/json"
    };
  }
  // Test connection to the API
  async testConnection() {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        method: "GET",
        headers: this.defaultHeaders
      });
      if (!response.ok) {
        return {
          success: false,
          error: `Health check failed: ${response.status} ${response.statusText}`
        };
      }
      const health = await response.json();
      return {
        success: health.status === "healthy" || health.status === "degraded",
        error: health.status !== "healthy" ? health.error : void 0
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed"
      };
    }
  }
  // Send streaming chat message (matches your /api/chat endpoint)
  async sendStreamingMessage(request) {
    const response = await fetch(`${this.apiUrl}/api/chat`, {
      method: "POST",
      headers: {
        ...this.defaultHeaders,
        Accept: "text/event-stream"
      },
      body: JSON.stringify({
        ...request,
        stream: true
        // Force streaming
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response;
  }
  // Send non-streaming chat message
  async sendMessage(request) {
    const response = await fetch(`${this.apiUrl}/api/chat`, {
      method: "POST",
      headers: this.defaultHeaders,
      body: JSON.stringify({
        ...request,
        stream: false
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return response.json();
  }
  // Process Server-Sent Events stream (matches your streaming format)
  async *processStreamingResponse(response) {
    var _a;
    const reader = (_a = response.body) == null ? void 0 : _a.getReader();
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
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith("data: ")) {
            const data = trimmedLine.slice(6);
            if (data === "[DONE]") {
              return;
            }
            try {
              const parsed = JSON.parse(data);
              yield parsed;
            } catch (e) {
              console.warn("Failed to parse SSE data:", data, e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
  // Get available models (matches your /api/chat/models endpoint)
  async getAvailableModels() {
    const response = await fetch(`${this.apiUrl}/api/chat/models`, {
      method: "GET",
      headers: this.defaultHeaders
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }
    return response.json();
  }
  // Test the API connection (matches your /api/chat/test endpoint)
  async testChat() {
    try {
      const response = await fetch(`${this.apiUrl}/api/chat/test`, {
        method: "GET",
        headers: this.defaultHeaders
      });
      if (!response.ok) {
        return { success: false, message: `Test failed: ${response.status}` };
      }
      const result = await response.json();
      return {
        success: true,
        message: result.message || "Test successful"
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Test failed"
      };
    }
  }
  // Get content types (if Contentstack is enabled)
  async getContentTypes() {
    try {
      const response = await fetch(`${this.apiUrl}/api/chat/content-types`, {
        method: "GET",
        headers: this.defaultHeaders
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
const useChat = (apiUrl, options) => {
  const [state, setState] = useState({
    messages: [],
    isLoading: false,
    isConnected: false,
    error: null,
    conversationId: null
  });
  const chatApiRef = useRef(new ChatApiService(apiUrl));
  const abortControllerRef = useRef(null);
  const connectionTestedRef = useRef(false);
  useEffect(() => {
    const testConnection = async () => {
      if (connectionTestedRef.current) return;
      try {
        connectionTestedRef.current = true;
        const result = await chatApiRef.current.testConnection();
        setState((prev) => ({
          ...prev,
          isConnected: result.success,
          error: result.success ? null : result.error || "Connection failed"
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isConnected: false,
          error: error instanceof Error ? error.message : "Connection test failed"
        }));
      }
    };
    testConnection();
  }, []);
  const sendMessage = useCallback(
    async (content, streaming = true) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const userMessage = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content,
        role: "user",
        timestamp: /* @__PURE__ */ new Date(),
        metadata: (options == null ? void 0 : options.userId) ? {
          userId: options.userId
        } : void 0
      };
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isLoading: true,
        error: null
      }));
      try {
        const request = {
          message: content,
          conversationId: state.conversationId || void 0,
          userId: (options == null ? void 0 : options.userId) || void 0,
          stream: streaming,
          useContentstack: (options == null ? void 0 : options.useContentstack) || void 0,
          contentTypes: (options == null ? void 0 : options.contentTypes) || void 0,
          maxContextLength: (options == null ? void 0 : options.maxContextLength) || void 0
        };
        if (streaming) {
          const response = await chatApiRef.current.sendStreamingMessage(
            request
          );
          let assistantMessage = {
            id: `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            content: "",
            role: "assistant",
            timestamp: /* @__PURE__ */ new Date(),
            metadata: {}
          };
          setState((prev) => ({
            ...prev,
            messages: [...prev.messages, assistantMessage],
            isConnected: true
          }));
          for await (const chunk of chatApiRef.current.processStreamingResponse(
            response
          )) {
            if (chunk.type === "content" && chunk.content) {
              assistantMessage = {
                ...assistantMessage,
                content: assistantMessage.content + chunk.content
              };
              setState((prev) => ({
                ...prev,
                messages: [...prev.messages.slice(0, -1), assistantMessage]
              }));
            } else if (chunk.type === "done") {
              if (chunk.metadata.fullContent) {
                assistantMessage = {
                  ...assistantMessage,
                  content: chunk.metadata.fullContent,
                  timestamp: new Date(chunk.metadata.timestamp)
                };
                setState((prev) => ({
                  ...prev,
                  messages: [...prev.messages.slice(0, -1), assistantMessage],
                  conversationId: prev.conversationId || `conv-${Date.now()}`
                }));
              }
              break;
            } else if (chunk.type === "error") {
              throw new Error(chunk.error || "Streaming error occurred");
            }
          }
        } else {
          const response = await chatApiRef.current.sendMessage(request);
          const assistantMessage = {
            id: response.message.id,
            content: response.message.content,
            role: response.message.role,
            timestamp: new Date(response.message.timestamp),
            metadata: {
              contentEnhanced: response.enhancedWithContent
            }
          };
          setState((prev) => ({
            ...prev,
            messages: [...prev.messages, assistantMessage],
            conversationId: response.conversationId,
            isConnected: true
          }));
        }
      } catch (error) {
        console.error("Chat error:", error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "An error occurred while sending the message",
          isConnected: false
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
      error: null
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
        isLoading: false
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isConnected: false,
        error: error instanceof Error ? error.message : "Reconnection failed",
        isLoading: false
      }));
    }
  }, []);
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
    reconnect
  };
};
const defaultTheme = {
  primaryColor: "#007bff",
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  borderRadius: "8px",
  backgroundColor: "#ffffff",
  textColor: "#333333",
  inputBorderColor: "#e1e5e9",
  headerColor: "#007bff",
  userMessageColor: "#007bff",
  assistantMessageColor: "#f8f9fa"
};
const useTheme = (customTheme) => {
  const theme = useMemo(
    () => ({
      ...defaultTheme,
      ...customTheme
    }),
    [customTheme]
  );
  const cssVariables = useMemo(
    () => ({
      "--techsurf-chat-primary-color": theme.primaryColor,
      "--techsurf-chat-font-family": theme.fontFamily,
      "--techsurf-chat-border-radius": theme.borderRadius,
      "--techsurf-chat-bg-color": theme.backgroundColor,
      "--techsurf-chat-text-color": theme.textColor,
      "--techsurf-chat-input-border-color": theme.inputBorderColor,
      "--techsurf-chat-header-color": theme.headerColor,
      "--techsurf-chat-user-message-color": theme.userMessageColor,
      "--techsurf-chat-assistant-message-color": theme.assistantMessageColor
    }),
    [theme]
  );
  return { theme, cssVariables };
};
const ChatHeader = ({
  title,
  subtitle,
  onMinimize,
  onClose,
  isConnected = false,
  isLoading = false,
  showConnectionStatus = true
}) => {
  const getConnectionStatus = () => {
    if (isLoading)
      return { text: "Connecting...", className: "techsurf-connecting" };
    if (isConnected) return { text: "Online", className: "techsurf-connected" };
    return { text: "Offline", className: "techsurf-disconnected" };
  };
  const connectionStatus = getConnectionStatus();
  return /* @__PURE__ */ jsx("header", { className: "techsurf-chat-header", children: /* @__PURE__ */ jsxs("div", { className: "techsurf-header-content", children: [
    /* @__PURE__ */ jsxs("div", { className: "techsurf-header-info", children: [
      /* @__PURE__ */ jsx("h3", { className: "techsurf-chat-title", children: title }),
      subtitle && /* @__PURE__ */ jsx("p", { className: "techsurf-chat-subtitle", children: subtitle }),
      showConnectionStatus && /* @__PURE__ */ jsxs("div", { className: "techsurf-connection-status", children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: `techsurf-status-dot ${connectionStatus.className}`
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "techsurf-status-text", children: connectionStatus.text })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "techsurf-header-actions", children: [
      onMinimize && /* @__PURE__ */ jsx(
        "button",
        {
          className: "techsurf-header-button techsurf-minimize-button",
          onClick: onMinimize,
          "aria-label": "Minimize chat",
          type: "button",
          children: /* @__PURE__ */ jsx(
            "svg",
            {
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2",
              children: /* @__PURE__ */ jsx("line", { x1: "5", y1: "12", x2: "19", y2: "12" })
            }
          )
        }
      ),
      onClose && /* @__PURE__ */ jsx(
        "button",
        {
          className: "techsurf-header-button techsurf-close-button",
          onClick: onClose,
          "aria-label": "Close chat",
          type: "button",
          children: /* @__PURE__ */ jsxs(
            "svg",
            {
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2",
              children: [
                /* @__PURE__ */ jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
                /* @__PURE__ */ jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
              ]
            }
          )
        }
      )
    ] })
  ] }) });
};
const MessageBubble = ({
  message,
  isStreaming = false,
  showTimestamp = true
}) => {
  var _a;
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  if (isSystem) return null;
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  const messageClasses = [
    "techsurf-message-bubble",
    isUser ? "techsurf-user-message" : "techsurf-assistant-message",
    isStreaming ? "techsurf-streaming" : ""
  ].filter(Boolean).join(" ");
  return /* @__PURE__ */ jsxs("div", { className: messageClasses, children: [
    /* @__PURE__ */ jsxs("div", { className: "techsurf-message-content", children: [
      /* @__PURE__ */ jsxs("div", { className: "techsurf-message-text", children: [
        message.content,
        isStreaming && /* @__PURE__ */ jsx("span", { className: "techsurf-cursor", children: "|" })
      ] }),
      ((_a = message.metadata) == null ? void 0 : _a.contentEnhanced) && /* @__PURE__ */ jsx(
        "div",
        {
          className: "techsurf-content-badge",
          title: "Enhanced with knowledge base",
          children: "🧠 Enhanced"
        }
      )
    ] }),
    showTimestamp && /* @__PURE__ */ jsx("div", { className: "techsurf-message-timestamp", children: formatTime(message.timestamp) })
  ] });
};
const LoadingIndicator = ({
  message = "AI is thinking...",
  className = ""
}) => {
  return /* @__PURE__ */ jsxs("div", { className: `techsurf-loading-indicator ${className}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "techsurf-loading-dots", children: [
      /* @__PURE__ */ jsx("div", { className: "techsurf-dot" }),
      /* @__PURE__ */ jsx("div", { className: "techsurf-dot" }),
      /* @__PURE__ */ jsx("div", { className: "techsurf-dot" })
    ] }),
    /* @__PURE__ */ jsx("span", { className: "techsurf-loading-message", children: message })
  ] });
};
const MessageList = ({
  messages,
  isLoading,
  error,
  onRetry,
  showTimestamps = true,
  emptyStateMessage = "Start a conversation with your AI assistant!"
}) => {
  var _a;
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end"
      });
    }
  };
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [messages.length, isLoading]);
  const displayMessages = messages.filter((msg) => msg.role !== "system");
  return /* @__PURE__ */ jsxs("div", { className: "techsurf-message-list", ref: containerRef, children: [
    /* @__PURE__ */ jsxs("div", { className: "techsurf-messages-container", children: [
      displayMessages.length === 0 && !isLoading && !error && /* @__PURE__ */ jsxs("div", { className: "techsurf-empty-state", children: [
        /* @__PURE__ */ jsx("div", { className: "techsurf-empty-icon", children: "💬" }),
        /* @__PURE__ */ jsx("p", { className: "techsurf-empty-message", children: emptyStateMessage })
      ] }),
      displayMessages.map((message, index) => /* @__PURE__ */ jsx(
        MessageBubble,
        {
          message,
          isStreaming: isLoading && message.role === "assistant" && index === displayMessages.length - 1,
          showTimestamp: showTimestamps
        },
        message.id
      )),
      isLoading && displayMessages.length > 0 && ((_a = displayMessages[displayMessages.length - 1]) == null ? void 0 : _a.role) === "user" && /* @__PURE__ */ jsx(LoadingIndicator, { message: "AI is responding..." }),
      error && /* @__PURE__ */ jsxs("div", { className: "techsurf-error-message", children: [
        /* @__PURE__ */ jsxs("div", { className: "techsurf-error-content", children: [
          /* @__PURE__ */ jsx("span", { className: "techsurf-error-icon", children: "⚠️" }),
          /* @__PURE__ */ jsx("span", { className: "techsurf-error-text", children: error })
        ] }),
        onRetry && /* @__PURE__ */ jsx(
          "button",
          {
            className: "techsurf-retry-button",
            onClick: onRetry,
            type: "button",
            children: "Retry"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { ref: messagesEndRef })
  ] });
};
const ChatInput = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message...",
  maxLength = 2e3,
  showSendButton = true
}) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);
  const formRef = useRef(null);
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 120;
      textarea.style.height = Math.min(scrollHeight, maxHeight) + "px";
    }
  };
  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);
  const handleSend = (e) => {
    if (e) {
      e.preventDefault();
    }
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled && trimmedMessage.length <= maxLength) {
      onSendMessage(trimmedMessage);
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };
  const handleKeyDown = (e) => {
    var _a;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape") {
      setMessage("");
      (_a = textareaRef.current) == null ? void 0 : _a.blur();
    }
  };
  const handleChange = (e) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      setMessage(newValue);
    }
  };
  const canSend = message.trim().length > 0 && !disabled && message.length <= maxLength;
  return /* @__PURE__ */ jsxs(
    "form",
    {
      className: "techsurf-chat-input-container",
      onSubmit: handleSend,
      ref: formRef,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "techsurf-input-wrapper", children: [
          /* @__PURE__ */ jsx(
            "textarea",
            {
              ref: textareaRef,
              className: "techsurf-message-input",
              value: message,
              onChange: handleChange,
              onKeyDown: handleKeyDown,
              placeholder: disabled ? "Connecting..." : placeholder,
              disabled,
              rows: 1,
              "aria-label": "Type your message"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "techsurf-input-actions", children: [
            maxLength > 0 && /* @__PURE__ */ jsxs(
              "div",
              {
                className: `techsurf-char-counter ${message.length > maxLength * 0.9 ? "techsurf-char-warning" : ""}`,
                children: [
                  message.length,
                  "/",
                  maxLength
                ]
              }
            ),
            showSendButton && /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                className: "techsurf-send-button",
                disabled: !canSend,
                "aria-label": "Send message",
                children: /* @__PURE__ */ jsxs(
                  "svg",
                  {
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: "2",
                    className: "techsurf-send-icon",
                    "aria-hidden": "true",
                    children: [
                      /* @__PURE__ */ jsx("line", { x1: "22", y1: "2", x2: "11", y2: "13" }),
                      /* @__PURE__ */ jsx("polygon", { points: "22,2 15,22 11,13 2,9 22,2" })
                    ]
                  }
                )
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "techsurf-input-hint", children: "Press Enter to send, Shift+Enter for new line, Esc to clear" })
      ]
    }
  );
};
const ChatWidget = ({
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
  maxContextLength = 2e3,
  onMessage,
  onError,
  onConnect,
  onDisconnect
}) => {
  var _a;
  const [isMinimized, setIsMinimized] = useState(minimized);
  const [isVisible, setIsVisible] = useState(!minimized);
  const [hasInteracted, setHasInteracted] = useState(false);
  const chatOptions = {
    agentId: agentId || void 0,
    useContentstack: useContentstack || void 0,
    contentTypes: contentTypes || void 0,
    maxContextLength: maxContextLength || void 0,
    userId: `user-${Date.now()}`
    // Simple user ID generation
  };
  const {
    messages,
    isLoading,
    isConnected,
    error,
    sendMessage,
    retry,
    reconnect
  } = useChat(apiUrl, chatOptions);
  const { cssVariables } = useTheme(theme);
  useEffect(() => {
    if (onMessage && messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage && latestMessage.role === "assistant") {
        onMessage(latestMessage);
      }
    }
  }, [messages, onMessage]);
  useEffect(() => {
    if (onError && error) {
      onError(new Error(error));
    }
  }, [error, onError]);
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
    async (content) => {
      setHasInteracted(true);
      await sendMessage(content, true);
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
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isVisible && !isMinimized) {
        const activeElement = document.activeElement;
        const chatElement = document.querySelector(".techsurf-chat-widget");
        if (chatElement == null ? void 0 : chatElement.contains(activeElement)) {
          setIsMinimized(true);
        }
      }
    };
    if (isVisible) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isVisible, isMinimized]);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `techsurf-chat-widget-container ${getPositionClasses()}`,
      style: cssVariables,
      children: [
        !isVisible && /* @__PURE__ */ jsxs(
          "button",
          {
            className: "techsurf-chat-trigger-button",
            onClick: handleToggleVisibility,
            "aria-label": `Open ${title}`,
            type: "button",
            children: [
              /* @__PURE__ */ jsx(
                "svg",
                {
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2",
                  className: "techsurf-chat-icon",
                  "aria-hidden": "true",
                  children: /* @__PURE__ */ jsx("path", { d: "21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" })
                }
              ),
              !isConnected && hasInteracted && /* @__PURE__ */ jsx(
                "div",
                {
                  className: "techsurf-notification-badge",
                  "aria-label": "Connection issue",
                  children: "!"
                }
              )
            ]
          }
        ),
        isVisible && /* @__PURE__ */ jsxs(
          "div",
          {
            className: `techsurf-chat-widget ${isMinimized ? "techsurf-minimized" : ""}`,
            style: {
              height: isMinimized ? "auto" : height,
              width
            },
            role: "dialog",
            "aria-labelledby": "techsurf-chat-title",
            children: [
              /* @__PURE__ */ jsx(
                ChatHeader,
                {
                  title,
                  subtitle: useContentstack ? "Enhanced with knowledge base" : void 0,
                  onMinimize: handleMinimize,
                  onClose: handleToggleVisibility,
                  isConnected,
                  isLoading: isLoading && !hasInteracted,
                  showConnectionStatus: hasInteracted
                }
              ),
              !isMinimized && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(
                  MessageList,
                  {
                    messages,
                    isLoading,
                    error,
                    onRetry: handleRetry,
                    emptyStateMessage: `Hi! I'm your ${title.toLowerCase()}. ${useContentstack ? "I have access to our knowledge base to provide accurate information." : "How can I help you today?"}`
                  }
                ),
                /* @__PURE__ */ jsx(
                  ChatInput,
                  {
                    onSendMessage: handleSendMessage,
                    disabled: isLoading || !isConnected && hasInteracted,
                    placeholder: !isConnected && hasInteracted ? "Reconnecting..." : placeholder,
                    maxLength: 2e3
                  }
                ),
                typeof process !== "undefined" && ((_a = process.env) == null ? void 0 : _a.NODE_ENV) === "development" && /* @__PURE__ */ jsx("div", { className: "techsurf-debug-info", children: /* @__PURE__ */ jsxs("small", { children: [
                  "Connected: ",
                  isConnected ? "✓" : "✗",
                  " | Content:",
                  " ",
                  useContentstack ? "✓" : "✗",
                  " | Messages:",
                  " ",
                  messages.length
                ] }) })
              ] })
            ]
          }
        )
      ]
    }
  );
};
export {
  ChatApiService,
  ChatHeader,
  ChatInput,
  ChatWidget,
  LoadingIndicator,
  MessageBubble,
  MessageList,
  ChatWidget as TechSurfChatWidget,
  useChat,
  useTheme
};
//# sourceMappingURL=index.esm.js.map

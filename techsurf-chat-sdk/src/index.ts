// src/index.ts
// Import styles first
import "./styles/index.css";

// Main component export
export { default as ChatWidget } from "./ChatWidget";
export { ChatWidget as TechSurfChatWidget } from "./ChatWidget";

// Hook exports
export { useChat } from "./hooks/useChat";
export { useTheme } from "./hooks/useTheme";

// Service exports
export { ChatApiService } from "./services/chatApi";

// Type exports
export type {
  Message,
  ChatState,
  Theme,
  ChatWidgetProps,
  ApiChatResponse,
  ChatApiRequest,
  StreamChunk,
} from "./types";

// Component exports for advanced usage
export { ChatHeader } from "./components/ChatHeader";
export { MessageList } from "./components/MessageList";
export { MessageBubble } from "./components/MessageBubble";
export { ChatInput } from "./components/ChatInput";
export { LoadingIndicator } from "./components/LoadingIndicator";

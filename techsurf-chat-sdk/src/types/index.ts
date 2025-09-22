// src/types/index.ts
export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: Date;
  metadata?: {
    userId?: string | undefined;
    context?: Record<string, any> | undefined;
    contentEnhanced?: boolean | undefined;
    contentResultsCount?: number | undefined;
  };
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  conversationId: string | null;
}

export interface Theme {
  primaryColor: string;
  fontFamily: string;
  borderRadius?: string | undefined;
  backgroundColor?: string | undefined;
  textColor?: string | undefined;
  inputBorderColor?: string | undefined;
  headerColor?: string | undefined;
  userMessageColor?: string | undefined;
  assistantMessageColor?: string | undefined;
}

export interface ChatWidgetProps {
  apiUrl: string;
  agentId?: string | undefined;
  theme?: Partial<Theme> | undefined;
  title?: string | undefined;
  placeholder?: string | undefined;
  height?: string | undefined;
  width?: string | undefined;
  position?: "bottom-right" | "bottom-left" | "center" | undefined;
  minimized?: boolean | undefined;
  useContentstack?: boolean | undefined;
  contentTypes?: string[] | undefined;
  maxContextLength?: number | undefined;
  onMessage?: ((message: Message) => void) | undefined;
  onError?: ((error: Error) => void) | undefined;
  onConnect?: (() => void) | undefined;
  onDisconnect?: (() => void) | undefined;
}

// API Response types matching your existing API
export interface ApiChatResponse {
  id: string;
  message: {
    id: string;
    role: "assistant";
    content: string;
    timestamp: string;
  };
  conversationId: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  enhancedWithContent: boolean;
}

export interface ChatApiRequest {
  message: string;
  conversationId?: string | undefined;
  userId?: string | undefined;
  context?: Record<string, any> | undefined;
  stream?: boolean | undefined;
  useContentstack?: boolean | undefined;
  contentTypes?: string[] | undefined;
  maxContextLength?: number | undefined;
}

export interface StreamChunk {
  id: string;
  type: "content" | "done" | "error";
  content?: string | undefined;
  error?: string | undefined;
  metadata: {
    timestamp: string;
    completed?: boolean | undefined;
    fullContent?: string | undefined;
  };
}

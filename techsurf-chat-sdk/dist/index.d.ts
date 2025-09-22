import { CSSProperties } from 'react';
import { default as default_2 } from 'react';

export declare interface ApiChatResponse {
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

export declare interface ChatApiRequest {
    message: string;
    conversationId?: string | undefined;
    userId?: string | undefined;
    context?: Record<string, any> | undefined;
    stream?: boolean | undefined;
    useContentstack?: boolean | undefined;
    contentTypes?: string[] | undefined;
    maxContextLength?: number | undefined;
}

export declare class ChatApiService {
    private apiUrl;
    private defaultHeaders;
    constructor(apiUrl: string);
    testConnection(): Promise<{
        success: boolean;
        error?: string;
    }>;
    sendStreamingMessage(request: ChatApiRequest): Promise<Response>;
    sendMessage(request: ChatApiRequest): Promise<ApiChatResponse>;
    processStreamingResponse(response: Response): AsyncGenerator<StreamChunk, void, unknown>;
    getAvailableModels(): Promise<{
        models: string[];
        current: {
            name: string;
            description: string;
            maxTokens: number;
        };
        features: Record<string, boolean>;
    }>;
    testChat(): Promise<{
        success: boolean;
        message: string;
    }>;
    getContentTypes(): Promise<string[]>;
}

export declare const ChatHeader: default_2.FC<ChatHeaderProps>;

declare interface ChatHeaderProps {
    title: string;
    subtitle?: string | undefined;
    onMinimize?: (() => void) | undefined;
    onClose?: (() => void) | undefined;
    isConnected?: boolean | undefined;
    isLoading?: boolean | undefined;
    showConnectionStatus?: boolean | undefined;
}

export declare const ChatInput: default_2.FC<ChatInputProps>;

declare interface ChatInputProps {
    onSendMessage: (message: string) => void;
    disabled?: boolean;
    placeholder?: string;
    maxLength?: number;
    showSendButton?: boolean;
}

export declare interface ChatState {
    messages: Message[];
    isLoading: boolean;
    isConnected: boolean;
    error: string | null;
    conversationId: string | null;
}

declare const ChatWidget: default_2.FC<ChatWidgetProps>;
export { ChatWidget }
export { ChatWidget as TechSurfChatWidget }

export declare interface ChatWidgetProps {
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

export declare const LoadingIndicator: default_2.FC<LoadingIndicatorProps>;

declare interface LoadingIndicatorProps {
    message?: string;
    className?: string;
}

export declare interface Message {
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

export declare const MessageBubble: default_2.FC<MessageBubbleProps>;

declare interface MessageBubbleProps {
    message: Message;
    isStreaming?: boolean;
    showTimestamp?: boolean;
}

export declare const MessageList: default_2.FC<MessageListProps>;

declare interface MessageListProps {
    messages: Message[];
    isLoading: boolean;
    error: string | null;
    onRetry?: () => void;
    showTimestamps?: boolean;
    emptyStateMessage?: string;
}

export declare interface StreamChunk {
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

export declare interface Theme {
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

export declare const useChat: (apiUrl: string, options?: {
    agentId?: string | undefined;
    useContentstack?: boolean | undefined;
    contentTypes?: string[] | undefined;
    maxContextLength?: number | undefined;
    userId?: string | undefined;
}) => {
    sendMessage: (content: string, streaming?: boolean) => Promise<void>;
    clearMessages: () => void;
    retry: () => void;
    reconnect: () => Promise<void>;
    messages: Message[];
    isLoading: boolean;
    isConnected: boolean;
    error: string | null;
    conversationId: string | null;
};

export declare const useTheme: (customTheme?: Partial<Theme>) => {
    theme: {
        primaryColor: string;
        fontFamily: string;
        borderRadius?: string | undefined;
        backgroundColor?: string | undefined;
        textColor?: string | undefined;
        inputBorderColor?: string | undefined;
        headerColor?: string | undefined;
        userMessageColor?: string | undefined;
        assistantMessageColor?: string | undefined;
    };
    cssVariables: CSSProperties;
};

export { }

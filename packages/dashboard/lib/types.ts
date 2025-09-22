export interface AgentConfig {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  userId: string;

  // Core Settings
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;

  // Contentstack Integration
  useContentstack: boolean;
  contentTypes: string[];
  maxContextLength: number;

  // UI Configuration
  theme: {
    primaryColor: string;
    fontFamily: string;
    borderRadius: string;
    position: "bottom-right" | "bottom-left" | "center";
  };

  // Analytics
  totalConversations: number;
  totalMessages: number;
  averageResponseTime: number;
  lastUsed: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  agentId?: string;
  userId?: string;
}

export interface ConversationRecord {
  id: string;
  agentId: string;
  userId: string;
  messages: ChatMessage[];
  startTime: Date;
  endTime?: Date;
  satisfaction?: number;
}

export interface AnalyticsData {
  totalConversations: number;
  totalMessages: number;
  averageResponseTime: number;
  satisfactionScore: number;
  usageOverTime: {
    date: string;
    conversations: number;
    messages: number;
  }[];
  topAgents: {
    id: string;
    name: string;
    conversations: number;
  }[];
}

export interface ContentstackContentType {
  uid: string;
  title: string;
  schema: any[];
}

export interface ContentstackEntry {
  uid: string;
  title: string;
  url?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

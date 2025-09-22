"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Minimize2, Maximize2 } from "lucide-react";
import { AgentConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ChatPreviewProps {
  config: Partial<AgentConfig>;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function ChatPreview({ config }: ChatPreviewProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `This is a preview response based on your configuration. In the real implementation, I would use the "${
          config.model || "llama-3.1-8b-instant"
        }" model with temperature ${config.temperature || 0.7}${
          config.useContentstack ? " and search your Contentstack content" : ""
        }.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000 + Math.random() * 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div
        className="relative rounded-lg shadow-lg overflow-hidden border"
        style={{
          backgroundColor: "white",
          borderColor: config.theme?.primaryColor || "#007bff",
          fontFamily: config.theme?.fontFamily || "Inter, sans-serif",
        }}
      >
        {/* Header */}
        <div
          className="p-4 text-white flex items-center justify-between"
          style={{ backgroundColor: config.theme?.primaryColor || "#007bff" }}
        >
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            <span className="font-medium">{config.name || "AI Assistant"}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Chat Body */}
        {!isMinimized && (
          <>
            <div className="h-80 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                      style={{
                        backgroundColor:
                          config.theme?.primaryColor || "#007bff",
                      }}
                    >
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-xs px-3 py-2 rounded-lg text-sm",
                      message.role === "user"
                        ? "text-white ml-8"
                        : "bg-gray-100 text-gray-900 mr-8"
                    )}
                    style={
                      message.role === "user"
                        ? {
                            backgroundColor:
                              config.theme?.primaryColor || "#007bff",
                          }
                        : {}
                    }
                  >
                    {message.content}
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                    style={{
                      backgroundColor: config.theme?.primaryColor || "#007bff",
                    }}
                  >
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="max-w-xs px-3 py-2 rounded-lg bg-gray-100">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  size="sm"
                  style={{
                    backgroundColor: config.theme?.primaryColor || "#007bff",
                  }}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        This is a preview of your chat widget
      </div>
    </div>
  );
}

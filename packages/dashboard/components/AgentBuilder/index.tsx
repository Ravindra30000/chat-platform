"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfigurationPanel } from "./ConfigurationPanel";
import { ContentTypeSelector } from "./ContentTypeSelector";
import { ChatPreview } from "../ChatPreview";
import { CodeGenerator } from "../CodeGenerator";
import { Button } from "@/components/ui/button";
import { Save, Eye, Code } from "lucide-react";
import { AgentConfig } from "@/lib/types";

interface AgentBuilderProps {
  mode: "create" | "edit";
  initialData?: Partial<AgentConfig>;
  onSave?: (config: AgentConfig) => void;
}

export function AgentBuilder({ mode, initialData, onSave }: AgentBuilderProps) {
  const [config, setConfig] = useState<Partial<AgentConfig>>({
    name: "",
    description: "",
    model: "llama-3.1-8b-instant",
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: "You are a helpful AI assistant.",
    useContentstack: true,
    contentTypes: [],
    maxContextLength: 2000,
    theme: {
      primaryColor: "#007bff",
      fontFamily: "Inter, sans-serif",
      borderRadius: "8px",
      position: "bottom-right",
    },
    ...initialData,
  });

  const [activeTab, setActiveTab] = useState("configuration");

  const handleConfigChange = (updates: Partial<AgentConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    if (onSave && config.name && config.systemPrompt) {
      const fullConfig = {
        id: initialData?.id || crypto.randomUUID(),
        totalConversations: 0,
        totalMessages: 0,
        averageResponseTime: 0,
        lastUsed: new Date(),
        createdAt: initialData?.createdAt || new Date(),
        updatedAt: new Date(),
        userId: "", // Will be set by API
        ...config,
      } as AgentConfig;

      await onSave(fullConfig);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">
            {mode === "create" ? "Create" : "Edit"} Agent
          </h2>
          <p className="text-gray-600 mt-1">
            Configure your AI chat agent with Contentstack integration
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setActiveTab("preview")}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" onClick={() => setActiveTab("integration")}>
            <Code className="w-4 h-4 mr-2" />
            Get Code
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Agent
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="content">Content Types</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-6">
          <ConfigurationPanel config={config} onChange={handleConfigChange} />
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <ContentTypeSelector
            selectedTypes={config.contentTypes || []}
            onChange={(contentTypes) => handleConfigChange({ contentTypes })}
          />
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>
                Test your agent configuration with a live chat preview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChatPreview config={config} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration Code</CardTitle>
              <CardDescription>
                Copy this code to integrate your chat agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeGenerator agentConfig={config} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

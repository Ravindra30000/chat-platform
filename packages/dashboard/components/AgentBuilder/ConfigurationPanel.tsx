"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AgentConfig } from "@/lib/types";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConfigurationPanelProps {
  config: Partial<AgentConfig>;
  onChange: (updates: Partial<AgentConfig>) => void;
}

export function ConfigurationPanel({
  config,
  onChange,
}: ConfigurationPanelProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Basic Settings</CardTitle>
          <CardDescription>
            Configure the basic properties of your chat agent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Agent Name *</Label>
            <Input
              id="name"
              value={config.name || ""}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="e.g., Customer Support Bot"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={config.description || ""}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Brief description of your agent's purpose..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="system-prompt">System Prompt *</Label>
            <Textarea
              id="system-prompt"
              value={config.systemPrompt || ""}
              onChange={(e) => onChange({ systemPrompt: e.target.value })}
              placeholder="You are a helpful AI assistant..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Model Settings</CardTitle>
          <CardDescription>
            Fine-tune the AI behavior and response characteristics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="model">AI Model</Label>
            <Select
              value={config.model}
              onValueChange={(value) => onChange({ model: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="llama-3.1-8b-instant">
                  Llama 3.1 8B Instant
                </SelectItem>
                <SelectItem value="llama-3.2-1b-preview">
                  Llama 3.2 1B Preview
                </SelectItem>
                <SelectItem value="mixtral-8x7b-32768">Mixtral 8x7B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Temperature: {config.temperature}</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Controls creativity. Lower = more focused, Higher = more
                      creative
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Slider
              value={[config.temperature || 0.7]}
              onValueChange={(value) => onChange({ temperature: value })}
              max={2}
              min={0}
              step={0.1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Max Tokens: {config.maxTokens}</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Maximum length of responses</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Slider
              value={[config.maxTokens || 2048]}
              onValueChange={(value) => onChange({ maxTokens: value })}
              max={4096}
              min={256}
              step={256}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contentstack Integration</CardTitle>
          <CardDescription>
            Configure how your agent uses Contentstack content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="use-contentstack"
              checked={config.useContentstack || false}
              onCheckedChange={(checked) =>
                onChange({ useContentstack: checked })
              }
            />
            <Label htmlFor="use-contentstack">
              Enable Contentstack Integration
            </Label>
          </div>

          {config.useContentstack && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Max Context Length: {config.maxContextLength}</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Maximum length of content context to include</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Slider
                value={[config.maxContextLength || 2000]}
                onValueChange={(value) => onChange({ maxContextLength: value })}
                max={4000}
                min={500}
                step={250}
                className="w-full"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Widget Appearance</CardTitle>
          <CardDescription>
            Customize the look and feel of your chat widget
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="primary-color">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="primary-color"
                type="color"
                value={config.theme?.primaryColor || "#007bff"}
                onChange={(e) =>
                  onChange({
                    theme: { ...config.theme, primaryColor: e.target.value },
                  })
                }
                className="w-16 h-10 p-1 border rounded"
              />
              <Input
                value={config.theme?.primaryColor || "#007bff"}
                onChange={(e) =>
                  onChange({
                    theme: { ...config.theme, primaryColor: e.target.value },
                  })
                }
                placeholder="#007bff"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Widget Position</Label>
            <Select
              value={config.theme?.position || "bottom-right"}
              onValueChange={(value: any) =>
                onChange({
                  theme: { ...config.theme, position: value },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="font-family">Font Family</Label>
            <Input
              id="font-family"
              value={config.theme?.fontFamily || "Inter, sans-serif"}
              onChange={(e) =>
                onChange({
                  theme: { ...config.theme, fontFamily: e.target.value },
                })
              }
              placeholder="Inter, sans-serif"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

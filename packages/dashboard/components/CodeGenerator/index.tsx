"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check } from "lucide-react";
import { AgentConfig } from "@/lib/types";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeGeneratorProps {
  agentConfig?: Partial<AgentConfig>;
  type?: "installation" | "basic" | "advanced" | "ecommerce" | "docs";
}

export function CodeGenerator({
  agentConfig,
  type = "basic",
}: CodeGeneratorProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const generateInstallationCode = () => `# Install the TechSurf Chat SDK
npm install @techsurf/chat-sdk

# Or using yarn
yarn add @techsurf/chat-sdk`;

  const generateBasicCode = () => `import React from 'react';
import { ChatWidget } from '@techsurf/chat-sdk';
import '@techsurf/chat-sdk/dist/index.css';

function App() {
  return (
    <div className="App">
      <h1>My Website</h1>
      
      <ChatWidget
        apiUrl="${process.env.CORE_API_URL || "http://localhost:3001"}"
        ${agentConfig?.id ? `agentId="${agentConfig.id}"` : ""}
        title="${agentConfig?.name || "AI Assistant"}"
        placeholder="Ask me anything..."
        useContentstack={${agentConfig?.useContentstack || true}}
        ${
          agentConfig?.contentTypes?.length
            ? `contentTypes={${JSON.stringify(agentConfig.contentTypes)}}`
            : ""
        }
      />
    </div>
  );
}

export default App;`;

  const generateAdvancedCode = () => `import React from 'react';
import { ChatWidget } from '@techsurf/chat-sdk';
import '@techsurf/chat-sdk/dist/index.css';

function App() {
  const handleMessage = (message) => {
    console.log('New message:', message);
    // Send to analytics, save to storage, etc.
  };

  const handleError = (error) => {
    console.error('Chat error:', error);
    // Send to error tracking service
  };

  const customTheme = {
    primaryColor: '${agentConfig?.theme?.primaryColor || "#007bff"}',
    fontFamily: '${agentConfig?.theme?.fontFamily || "Inter, sans-serif"}',
    borderRadius: '${agentConfig?.theme?.borderRadius || "8px"}',
    backgroundColor: '#ffffff',
    textColor: '#333333',
    userMessageColor: '${agentConfig?.theme?.primaryColor || "#007bff"}',
    assistantMessageColor: '#f8f9fa'
  };

  return (
    <div className="App">
      <ChatWidget
        apiUrl="${process.env.CORE_API_URL || "http://localhost:3001"}"
        ${agentConfig?.id ? `agentId="${agentConfig.id}"` : ""}
        title="${agentConfig?.name || "AI Assistant"}"
        placeholder="Type your message..."
        theme={customTheme}
        height="600px"
        width="400px"
        position="${agentConfig?.theme?.position || "bottom-right"}"
        useContentstack={${agentConfig?.useContentstack || true}}
        ${
          agentConfig?.contentTypes?.length
            ? `contentTypes={${JSON.stringify(agentConfig.contentTypes)}}`
            : ""
        }
        maxContextLength={${agentConfig?.maxContextLength || 2000}}
        onMessage={handleMessage}
        onError={handleError}
        onConnect={() => console.log('Chat connected')}
        onDisconnect={() => console.log('Chat disconnected')}
      />
    </div>
  );
}

export default App;`;

  const generateEcommerceCode = () => `import React from 'react';
import { ChatWidget } from '@techsurf/chat-sdk';
import '@techsurf/chat-sdk/dist/index.css';

function EcommerceApp() {
  return (
    <div className="ecommerce-site">
      <header>
        <h1>Online Store</h1>
      </header>
      
      <main>
        {/* Your e-commerce content */}
      </main>
      
      <ChatWidget
        apiUrl="http://localhost:3001"
        title="🛍️ Shopping Assistant"
        placeholder="Ask about products, orders, or shipping..."
        useContentstack={true}
        contentTypes={['products', 'faq', 'shipping_info']}
        theme={{
          primaryColor: '#e91e63',
          fontFamily: 'Roboto, sans-serif'
        }}
        position="bottom-right"
        onMessage={(message) => {
          // Track customer service interactions
          analytics.track('chat_message', {
            message: message.content,
            timestamp: message.timestamp
          });
        }}
      />
    </div>
  );
}

export default EcommerceApp;`;

  const generateDocsCode = () => `import React from 'react';
import { ChatWidget } from '@techsurf/chat-sdk';
import '@techsurf/chat-sdk/dist/index.css';

function DocumentationSite() {
  return (
    <div className="docs-site">
      <nav>Documentation Navigation</nav>
      
      <main className="docs-content">
        {/* Your documentation content */}
      </main>
      
      <ChatWidget
        apiUrl="http://localhost:3001"
        title="📚 Docs Helper"
        placeholder="Ask about APIs, guides, or examples..."
        useContentstack={true}
        contentTypes={['api_docs', 'tutorials', 'examples']}
        theme={{
          primaryColor: '#4caf50',
          fontFamily: 'Monaco, monospace',
          position: 'bottom-left'
        }}
        height="500px"
        onMessage={(message) => {
          // Track documentation queries
          if (message.role === 'user') {
            trackQuery(message.content);
          }
        }}
      />
    </div>
  );
}

export default DocumentationSite;`;

  const generateHTMLCode = () => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website with TechSurf Chat</title>
</head>
<body>
    <h1>Welcome to My Website</h1>
    
    <!-- TechSurf Chat Widget -->
    <script src="https://unpkg.com/@techsurf/chat-sdk@latest/dist/standalone.js"></script>
    <script>
        TechSurfChat.init({
            apiUrl: '${process.env.CORE_API_URL || "http://localhost:3001"}',
            ${agentConfig?.id ? `agentId: '${agentConfig.id}',` : ""}
            title: '${agentConfig?.name || "AI Assistant"}',
            placeholder: 'Ask me anything...',
            useContentstack: ${agentConfig?.useContentstack || true},
            theme: {
                primaryColor: '${agentConfig?.theme?.primaryColor || "#007bff"}'
            }
        });
    </script>
</body>
</html>`;

  const codeExamples = {
    installation: generateInstallationCode(),
    basic: generateBasicCode(),
    advanced: generateAdvancedCode(),
    ecommerce: generateEcommerceCode(),
    docs: generateDocsCode(),
    html: generateHTMLCode(),
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue={type} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="installation">Install</TabsTrigger>
          <TabsTrigger value="basic">React</TabsTrigger>
          <TabsTrigger value="html">HTML</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="installation">
          <Card>
            <CardHeader>
              <CardTitle>Installation</CardTitle>
              <CardDescription>
                Install the TechSurf Chat SDK in your project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <SyntaxHighlighter
                  language="bash"
                  style={vscDarkPlus}
                  customStyle={{
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                >
                  {codeExamples.installation}
                </SyntaxHighlighter>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() =>
                    copyToClipboard(codeExamples.installation, "installation")
                  }
                >
                  {copiedCode === "installation" ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>React Implementation</CardTitle>
              <CardDescription>Basic React component usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <SyntaxHighlighter
                  language="javascript"
                  style={vscDarkPlus}
                  customStyle={{
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                >
                  {codeExamples.basic}
                </SyntaxHighlighter>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(codeExamples.basic, "basic")}
                >
                  {copiedCode === "basic" ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="html">
          <Card>
            <CardHeader>
              <CardTitle>HTML Implementation</CardTitle>
              <CardDescription>Vanilla HTML/JavaScript usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <SyntaxHighlighter
                  language="html"
                  style={vscDarkPlus}
                  customStyle={{
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                >
                  {codeExamples.html}
                </SyntaxHighlighter>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(codeExamples.html, "html")}
                >
                  {copiedCode === "html" ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Configuration</CardTitle>
              <CardDescription>
                Full configuration with event handlers and custom theming
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <SyntaxHighlighter
                  language="javascript"
                  style={vscDarkPlus}
                  customStyle={{
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                >
                  {codeExamples.advanced}
                </SyntaxHighlighter>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() =>
                    copyToClipboard(codeExamples.advanced, "advanced")
                  }
                >
                  {copiedCode === "advanced" ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

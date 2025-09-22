# @techsurf/chat-sdk

An embeddable React chat widget SDK for the TechSurf 2025 chat platform with real-time streaming, Contentstack MCP integration, and TypeScript support.

## 🚀 Features

- **🔗 Seamless Integration**: Works with your existing TechSurf chat API
- **⚡ Real-time Streaming**: Server-Sent Events for live message streaming
- **🧠 Content Enhancement**: Contentstack MCP integration for knowledge-base powered responses
- **📱 Mobile Responsive**: Adaptive design for all screen sizes
- **🎨 Fully Customizable**: CSS custom properties for complete theming control
- **♿ Accessible**: WCAG compliant with keyboard navigation and screen reader support
- **🔧 TypeScript**: Complete type definitions included
- **📦 Lightweight**: Optimized bundle size (< 50KB gzipped)

## 📋 Quick Start

### Installation

npm install @techsurf/chat-sdk


### Basic Usage

import { ChatWidget } from '@techsurf/chat-sdk';
import '@techsurf/chat-sdk/dist/index.css';

function App() {
return (
<ChatWidget
apiUrl="http://localhost:3001" // Your TechSurf API URL
title="Travel Assistant"
placeholder="Ask me about destinations..."
/>
);
}

text

## 🔧 Configuration

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiUrl` | `string` | **Required** | Your TechSurf chat API endpoint |
| `agentId` | `string` | `undefined` | Specific agent identifier |
| `title` | `string` | `'AI Assistant'` | Widget header title |
| `placeholder` | `string` | `'Type your message...'` | Input placeholder text |
| `theme` | `Partial<Theme>` | Default theme | Custom theme configuration |
| `height` | `string` | `'500px'` | Widget height |
| `width` | `string` | `'380px'` | Widget width |
| `position` | `'bottom-right' \| 'bottom-left' \| 'center'` | `'bottom-right'` | Screen position |
| `minimized` | `boolean` | `false` | Start minimized |
| `useContentstack` | `boolean` | `true` | Enable Contentstack MCP enhancement |
| `contentTypes` | `string[]` | `[]` | Specific content types to search |
| `maxContextLength` | `number` | `2000` | Maximum context length for content |

### Theme Configuration

const customTheme = {
primaryColor: '#007bff',
fontFamily: 'Inter, sans-serif',
borderRadius: '12px',
backgroundColor: '#ffffff',
textColor: '#333333',
userMessageColor: '#007bff',
assistantMessageColor: '#f8f9fa'
};

<ChatWidget apiUrl="http://localhost:3001" theme={customTheme} />

text

## 💡 Advanced Usage

### With Event Handlers

<ChatWidget
apiUrl="http://localhost:3001"
onMessage={(message) => {
console.log('New message:', message);
// Send to analytics, save to storage, etc.
}}
onError={(error) => {
console.error('Chat error:', error);
// Send to error tracking service
}}
onConnect={() => {
console.log('Chat connected');
}}
onDisconnect={() => {
console.log('Chat disconnected');
}}
/>

text

### Using Hooks Directly

import { useChat } from '@techsurf/chat-sdk';

function CustomChatInterface() {
const {
messages,
isLoading,
isConnected,
error,
sendMessage,
retry
} = useChat('http://localhost:3001', {
useContentstack: true,
contentTypes: ['faq', 'article'],
});

return (
<div>
{messages.map(message => (
<div key={message.id}>{message.content}</div>
))}
<button onClick={() => sendMessage('Hello!')}>
Send Message
</button>
</div>
);
}

text

## 🛠 Setup Instructions

1. **Create SDK Directory**:
cd ~/Desktop/chat-platform/
mkdir -p techsurf-chat-sdk
cd techsurf-chat-sdk

text

2. **Install Dependencies**:
npm install

text

3. **Build the SDK**:
npm run build

text

4. **Test with your API**:
Make sure your TechSurf API is running on localhost:3001
npm run dev

text

## 🎯 Integration Examples

### Basic (2-3 lines)
import { ChatWidget } from '@techsurf/chat-sdk';
<ChatWidget apiUrl="http://localhost:3001" />

text

### Advanced Configuration
<ChatWidget
apiUrl="http://localhost:3001"
agentId="travel-agent-123"
title="🌍 Travel Assistant"
useContentstack={true}
contentTypes={['destination', 'hotel', 'flight']}
theme={{ primaryColor: "#007bff" }}
position="bottom-right"
height="600px"
/>

text

## 🤝 Support

Built specifically for TechSurf 2025 - integrates seamlessly with your existing API infrastructure.

## 📄 License

MIT License - Built for TechSurf 2025 Hackathon 🚀
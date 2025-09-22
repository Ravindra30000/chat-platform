// standalone-widget.js - Complete self-contained TechSurf Chat Widget
(() => {
  "use strict";

  // Inject CSS styles
  const styles = `
    .techsurf-chat-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
    }

    .techsurf-chat-trigger {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #007bff, #0056b3);
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(0,123,255,0.3);
      transition: all 0.3s ease;
      font-size: 24px;
    }

    .techsurf-chat-trigger:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 25px rgba(0,123,255,0.4);
    }

    .techsurf-chat-widget {
      position: absolute;
      bottom: 70px;
      right: 0;
      width: 350px;
      height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform: scale(0.95) translateY(10px);
      opacity: 0;
      transition: all 0.3s ease;
    }

    .techsurf-chat-widget.open {
      transform: scale(1) translateY(0);
      opacity: 1;
    }

    .techsurf-chat-header {
      background: linear-gradient(135deg, #007bff, #0056b3);
      color: white;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .techsurf-chat-title {
      font-weight: 600;
      font-size: 16px;
      margin: 0;
    }

    .techsurf-chat-close {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .techsurf-chat-close:hover {
      background: rgba(255,255,255,0.2);
    }

    .techsurf-chat-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .techsurf-message {
      max-width: 80%;
      padding: 12px 16px;
      border-radius: 18px;
      font-size: 14px;
      line-height: 1.4;
      animation: messageSlide 0.3s ease-out;
    }

    .techsurf-message.user {
      background: #007bff;
      color: white;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }

    .techsurf-message.assistant {
      background: #f8f9fa;
      color: #333;
      align-self: flex-start;
      border: 1px solid #e9ecef;
      border-bottom-left-radius: 4px;
    }

    .techsurf-message.loading {
      background: #f8f9fa;
      color: #666;
      align-self: flex-start;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .techsurf-loading-dots {
      display: flex;
      gap: 4px;
    }

    .techsurf-loading-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #666;
      animation: loadingDot 1.4s infinite ease-in-out both;
    }

    .techsurf-loading-dot:nth-child(1) { animation-delay: -0.32s; }
    .techsurf-loading-dot:nth-child(2) { animation-delay: -0.16s; }

    @keyframes loadingDot {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    .techsurf-chat-input-area {
      padding: 16px;
      border-top: 1px solid #e9ecef;
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }

    .techsurf-chat-input {
      flex: 1;
      border: 2px solid #e9ecef;
      border-radius: 20px;
      padding: 10px 16px;
      font-size: 14px;
      outline: none;
      resize: none;
      min-height: 20px;
      max-height: 80px;
      transition: border-color 0.2s;
    }

    .techsurf-chat-input:focus {
      border-color: #007bff;
    }

    .techsurf-send-button {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #007bff;
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .techsurf-send-button:hover:not(:disabled) {
      background: #0056b3;
      transform: scale(1.05);
    }

    .techsurf-send-button:disabled {
      background: #ccc;
      cursor: not-allowed;
      transform: none;
    }

    .techsurf-connection-status {
      font-size: 11px;
      opacity: 0.8;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .techsurf-status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .techsurf-status-dot.connected { background: #28a745; }
    .techsurf-status-dot.disconnected { background: #dc3545; }
    .techsurf-status-dot.connecting { 
      background: #ffc107;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    @keyframes messageSlide {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .techsurf-empty-state {
      text-align: center;
      color: #666;
      padding: 40px 20px;
      font-size: 14px;
    }

    .techsurf-empty-icon {
      font-size: 48px;
      margin-bottom: 12px;
      opacity: 0.5;
    }

    /* Mobile responsive */
    @media (max-width: 480px) {
      .techsurf-chat-widget {
        position: fixed;
        bottom: 0;
        right: 0;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        border-radius: 0;
      }
      
      .techsurf-chat-container {
        bottom: 10px;
        right: 10px;
      }
    }
  `;

  // Inject styles into page
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // TechSurf Chat Widget Class
  class TechSurfChatWidget {
    constructor(options = {}) {
      this.options = {
        apiUrl: options.apiUrl || "http://localhost:3001",
        title: options.title || "🚀 TechSurf Chat",
        placeholder: options.placeholder || "Type your message...",
        position: options.position || "bottom-right",
        useContentstack: options.useContentstack !== false,
        contentTypes: options.contentTypes || [],
        maxContextLength: options.maxContextLength || 2000,
        ...options,
      };

      this.isOpen = false;
      this.messages = [];
      this.isConnected = false;
      this.isLoading = false;
      this.conversationId = null;

      this.container = null;
      this.widget = null;
      this.messagesContainer = null;
      this.input = null;
      this.sendButton = null;

      this.init();
      this.testConnection();
    }

    init() {
      // Create container
      this.container = document.createElement("div");
      this.container.className = "techsurf-chat-container";

      // Create trigger button
      const trigger = document.createElement("button");
      trigger.className = "techsurf-chat-trigger";
      trigger.innerHTML = "💬";
      trigger.onclick = () => this.toggle();

      // Create widget
      this.widget = document.createElement("div");
      this.widget.className = "techsurf-chat-widget";

      this.widget.innerHTML = `
        <div class="techsurf-chat-header">
          <div>
            <div class="techsurf-chat-title">${this.options.title}</div>
            <div class="techsurf-connection-status">
              <div class="techsurf-status-dot connecting"></div>
              <span>Connecting...</span>
            </div>
          </div>
          <button class="techsurf-chat-close">×</button>
        </div>
        <div class="techsurf-chat-messages">
          <div class="techsurf-empty-state">
            <div class="techsurf-empty-icon">💬</div>
            <div>Hi! I'm your AI assistant.<br>How can I help you today?</div>
          </div>
        </div>
        <div class="techsurf-chat-input-area">
          <textarea 
            class="techsurf-chat-input" 
            placeholder="${this.options.placeholder}"
            rows="1"
          ></textarea>
          <button class="techsurf-send-button" disabled>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
            </svg>
          </button>
        </div>
      `;

      // Get elements
      this.messagesContainer = this.widget.querySelector(
        ".techsurf-chat-messages"
      );
      this.input = this.widget.querySelector(".techsurf-chat-input");
      this.sendButton = this.widget.querySelector(".techsurf-send-button");

      // Event listeners
      this.widget.querySelector(".techsurf-chat-close").onclick = () =>
        this.close();
      this.sendButton.onclick = () => this.sendMessage();

      this.input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      this.input.addEventListener("input", (e) => {
        this.sendButton.disabled = !e.target.value.trim();
        this.autoResize(e.target);
      });

      // Append to page
      this.container.appendChild(trigger);
      this.container.appendChild(this.widget);
      document.body.appendChild(this.container);
    }

    autoResize(textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 80) + "px";
    }

    async testConnection() {
      try {
        const response = await fetch(`${this.options.apiUrl}/health`);
        if (response.ok) {
          this.isConnected = true;
          this.updateConnectionStatus("connected", "Online");

          if (this.options.onConnect) {
            this.options.onConnect();
          }
        } else {
          this.updateConnectionStatus("disconnected", "API Error");
        }
      } catch (error) {
        this.updateConnectionStatus("disconnected", "Offline");
        console.warn("TechSurf Chat: Cannot connect to API:", error);
      }
    }

    updateConnectionStatus(status, text) {
      const statusDot = this.widget.querySelector(".techsurf-status-dot");
      const statusText = statusDot.nextElementSibling;

      statusDot.className = `techsurf-status-dot ${status}`;
      statusText.textContent = text;
    }

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }

    open() {
      this.isOpen = true;
      this.widget.classList.add("open");
      setTimeout(() => this.input.focus(), 300);
    }

    close() {
      this.isOpen = false;
      this.widget.classList.remove("open");
    }

    // async sendMessage() {
    //   const message = this.input.value.trim();
    //   if (!message || this.isLoading) return;

    //   // Add user message
    //   this.addMessage('user', message);
    //   this.input.value = '';
    //   this.sendButton.disabled = true;
    //   this.autoResize(this.input);

    //   // Show loading
    //   this.isLoading = true;
    //   this.showLoading();

    //   try {
    //     const response = await fetch(`${this.options.apiUrl}/api/chat`, {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json'
    //       },
    //       body: JSON.stringify({
    //         message: message,
    //         conversationId: this.conversationId,
    //         stream: false, // Use non-streaming for simplicity
    //         useContentstack: this.options.useContentstack,
    //         contentTypes: this.options.contentTypes,
    //         maxContextLength: this.options.maxContextLength
    //       })
    //     });

    //     if (!response.ok) {
    //       throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    //     }

    //     const data = await response.json();

    //     // Remove loading and add response
    //     this.hideLoading();
    //     this.addMessage('assistant', data.message.content);

    //     // Save conversation ID
    //     if (data.conversationId) {
    //       this.conversationId = data.conversationId;
    //     }

    //     // Call onMessage callback
    //     if (this.options.onMessage) {
    //       this.options.onMessage(data.message);
    //     }

    //   } catch (error) {
    //     this.hideLoading();
    //     this.addMessage('assistant', 'Sorry, I encountered an error. Please try again.');

    //     if (this.options.onError) {
    //       this.options.onError(error);
    //     }

    //     console.error('TechSurf Chat Error:', error);
    //   }

    //   this.isLoading = false;
    // }

    // async sendMessage() {
    //   const message = this.input.value.trim();
    //   if (!message || this.isLoading) return;

    //   // Add user message
    //   this.addMessage('user', message);
    //   this.input.value = '';
    //   this.sendButton.disabled = true;
    //   this.autoResize(this.input);

    //   // Show loading
    //   this.isLoading = true;
    //   this.showLoading();

    //   try {
    //     console.log('🚀 Sending message to API:', message);

    //     const requestBody = {
    //       message: message,
    //       conversationId: this.conversationId || undefined,
    //       stream: true, // Enable streaming
    //       useContentstack: true, // ENABLE for testing
    //       contentTypes: ["Products","Blog Post","FAQ"],
    //       maxContextLength: 1000
    //     };

    //     console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

    //     // First try the debug endpoint
    //     const debugResponse = await fetch(`${this.options.apiUrl}/api/chat/debug`, {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json'
    //       },
    //       body: JSON.stringify(requestBody)
    //     });

    //     console.log('🔍 Debug response status:', debugResponse.status);
    //     const debugData = await debugResponse.text();
    //     console.log('🔍 Debug response:', debugData);

    //     if (!debugResponse.ok) {
    //       throw new Error(`Debug endpoint failed: ${debugResponse.status} - ${debugData}`);
    //     }

    //     // Now try the actual chat endpoint
    //     const response = await fetch(`${this.options.apiUrl}/api/chat`, {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json'
    //       },
    //       body: JSON.stringify(requestBody)
    //     });

    //     console.log('💬 Chat response status:', response.status);

    //     if (!response.ok) {
    //       const errorText = await response.text();
    //       console.error('❌ Chat response error:', errorText);
    //       throw new Error(`HTTP ${response.status}: ${errorText}`);
    //     }

    //     const data = await response.json();
    //     console.log('✅ Chat response data:', data);

    //     // Remove loading and add response
    //     this.hideLoading();

    //     // In the sendMessage method, after receiving response:
    // if (data.message && data.message.content) {
    //   this.addMessage('assistant', data.message.content);

    //   // Show if response was enhanced with Contentstack
    //   if (data.enhancedWithContent) {
    //     console.log('🧠 Response was enhanced with Contentstack content!');
    //     // You could add a small badge/indicator in the UI
    //     const lastMessage = this.messagesContainer.lastElementChild;
    //     if (lastMessage) {
    //       lastMessage.style.borderLeft = '3px solid #28a745';
    //       lastMessage.title = 'Enhanced with knowledge base content';
    //     }
    //   }
    // }

    //     // Check if response has the expected structure
    //     if (data.message && data.message.content) {
    //       this.addMessage('assistant', data.message.content);
    //     } else if (typeof data === 'string') {
    //       this.addMessage('assistant', data);
    //     } else {
    //       this.addMessage('assistant', 'I received your message, but the response format was unexpected.');
    //       console.warn('Unexpected response format:', data);
    //     }

    //     // Save conversation ID
    //     if (data.conversationId) {
    //       this.conversationId = data.conversationId;
    //     }

    //     // Call onMessage callback
    //     if (this.options.onMessage) {
    //       this.options.onMessage(data.message || { content: 'Response received' });
    //     }

    //   } catch (error) {
    //     this.hideLoading();
    //     console.error('❌ TechSurf Chat Error:', error);

    //     // More specific error messages
    //     let errorMessage = 'Sorry, I encountered an error. ';

    //     if (error.message.includes('Failed to fetch')) {
    //       errorMessage += 'Cannot connect to the chat service. Please check if the API is running.';
    //     } else if (error.message.includes('400')) {
    //       errorMessage += 'There was a problem with the request format. Check the browser console for details.';
    //     } else if (error.message.includes('500')) {
    //       errorMessage += 'The chat service encountered an internal error. Please try again.';
    //     } else {
    //       errorMessage += `Please try again. Error: ${error.message}`;
    //     }

    //     this.addMessage('assistant', errorMessage);

    //     if (this.options.onError) {
    //       this.options.onError(error);
    //     }
    //   }

    //   this.isLoading = false;
    // }

    // async sendMessage() {
    //   const message = this.input.value.trim();
    //   if (!message || this.isLoading) return;

    //   // Add user message
    //   this.addMessage("user", message);
    //   this.input.value = "";
    //   this.sendButton.disabled = true;
    //   this.autoResize(this.input);

    //   // Show loading
    //   this.isLoading = true;
    //   this.showLoading();

    //   try {
    //     console.log("🚀 Sending message to API:", message);

    //     const requestBody = {
    //       message: message,
    //       conversationId: this.conversationId || undefined,
    //       stream: true, // Enable streaming
    //       useContentstack: true,
    //       contentTypes: ["products", "faq", "blog_posts"], // Use correct content type names
    //       maxContextLength: 1500,
    //     };

    //     console.log("📤 Request body:", JSON.stringify(requestBody, null, 2));

    //     // HANDLE STREAMING RESPONSE PROPERLY
    //     const response = await fetch(`${this.options.apiUrl}/api/chat`, {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //       body: JSON.stringify(requestBody),
    //     });

    //     console.log("💬 Chat response status:", response.status);

    //     if (!response.ok) {
    //       const errorText = await response.text();
    //       console.error("❌ Chat response error:", errorText);
    //       throw new Error(`HTTP ${response.status}: ${errorText}`);
    //     }

    //     // Handle Server-Sent Events (SSE) response
    //     if (
    //       response.headers.get("content-type")?.includes("text/event-stream")
    //     ) {
    //       console.log("📡 Handling SSE streaming response...");
    //       await this.handleStreamingResponse(response);
    //     } else {
    //       // Handle regular JSON response (fallback)
    //       const data = await response.json();
    //       console.log("✅ Chat response data:", data);
    //       this.hideLoading();

    //       if (data.message && data.message.content) {
    //         this.addMessage("assistant", data.message.content);
    //       }
    //     }

    //     // Save conversation ID
    //     if (this.conversationId) {
    //       // Already have one
    //     } else {
    //       this.conversationId = `conv-${Date.now()}`;
    //     }
    //   } catch (error) {
    //     this.hideLoading();
    //     console.error("❌ TechSurf Chat Error:", error);

    //     let errorMessage = "Sorry, I encountered an error. ";

    //     if (error.message.includes("Failed to fetch")) {
    //       errorMessage += "Cannot connect to the chat service.";
    //     } else if (error.message.includes("400")) {
    //       errorMessage += "Request format error.";
    //     } else if (error.message.includes("500")) {
    //       errorMessage += "Server error.";
    //     } else {
    //       errorMessage += error.message;
    //     }

    //     this.addMessage("assistant", errorMessage);

    //     if (this.options.onError) {
    //       this.options.onError(error);
    //     }
    //   }

    //   this.isLoading = false;
    // }

    // ADD THIS NEW METHOD to handle SSE streaming

    async sendMessage() {
      const message = this.input.value.trim();
      if (!message || this.isLoading) return;

      // Add user message
      this.addMessage("user", message);
      this.input.value = "";
      this.sendButton.disabled = true;
      this.autoResize(this.input);

      // Show loading
      this.isLoading = true;
      this.showLoading();

      try {
        console.log("🚀 Sending message to API:", message);

        // Generate proper UUID for conversation ID
        const generateUUID = () => {
          return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
            /[xy]/g,
            function (c) {
              var r = (Math.random() * 16) | 0,
                v = c == "x" ? r : (r & 0x3) | 0x8;
              return v.toString(16);
            }
          );
        };

        // Use proper UUID format for conversationId
        if (!this.conversationId) {
          this.conversationId = generateUUID();
        }

        const requestBody = {
          message: message,
          conversationId: this.conversationId, // Now properly formatted UUID
          stream: false, // Use non-streaming first to debug
          useContentstack: true,
          contentTypes: ["products", "faq", "blog_posts"], // Use your actual content type names
          maxContextLength: 1500,
        };

        console.log("📤 Request body:", JSON.stringify(requestBody, null, 2));

        // First test with debug endpoint
        const debugResponse = await fetch(
          `${this.options.apiUrl}/api/chat/debug`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          }
        );

        console.log("🔍 Debug response status:", debugResponse.status);
        const debugData = await debugResponse.text();
        console.log("🔍 Debug response:", debugData);

        if (!debugResponse.ok) {
          throw new Error(
            `Debug validation failed: ${debugResponse.status} - ${debugData}`
          );
        }

        // Now send to actual chat endpoint
        const response = await fetch(`${this.options.apiUrl}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        console.log("💬 Chat response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Chat response error:", errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log("✅ Chat response data:", data);

        // Remove loading and add response
        this.hideLoading();

        if (data.message && data.message.content) {
          this.addMessage("assistant", data.message.content);

          // Show if enhanced with Contentstack
          if (data.enhancedWithContent) {
            console.log("🧠 Response enhanced with Contentstack content!");
            const lastMessage = this.messagesContainer.lastElementChild;
            if (lastMessage) {
              lastMessage.style.borderLeft = "4px solid #28a745";
              lastMessage.title = "Enhanced with knowledge base content";
            }
          } else {
            console.log("⚠️ Response NOT enhanced with Contentstack");
          }
        } else {
          this.addMessage(
            "assistant",
            "I received your message but the response format was unexpected."
          );
          console.warn("Unexpected response format:", data);
        }

        if (this.options.onMessage) {
          this.options.onMessage(
            data.message || { content: "Response received" }
          );
        }
      } catch (error) {
        this.hideLoading();
        console.error("❌ TechSurf Chat Error:", error);

        let errorMessage = "Sorry, I encountered an error. ";

        if (error.message.includes("Failed to fetch")) {
          errorMessage += "Cannot connect to the chat service.";
        } else if (error.message.includes("400")) {
          errorMessage +=
            "Request validation failed. Check console for details.";
        } else if (error.message.includes("500")) {
          errorMessage += "Server error occurred.";
        } else {
          errorMessage += error.message;
        }

        this.addMessage("assistant", errorMessage);

        if (this.options.onError) {
          this.options.onError(error);
        }
      }

      this.isLoading = false;
    }

    async handleStreamingResponse(response) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";
      let messageId = null;

      // Remove loading indicator
      this.hideLoading();

      // Add empty assistant message to fill with streamed content
      this.addMessage("assistant", "");
      const assistantMessageElement = this.messagesContainer.lastElementChild;

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log("📡 SSE stream completed");
            break;
          }

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6); // Remove 'data: ' prefix

              if (data === "[DONE]") {
                console.log("📡 SSE stream finished");
                return;
              }

              try {
                const parsed = JSON.parse(data);
                console.log("📡 SSE chunk:", parsed);

                if (parsed.type === "content" && parsed.content) {
                  // Accumulate content
                  accumulatedContent += parsed.content;

                  // Update the assistant message in real-time
                  if (assistantMessageElement) {
                    const messageTextEl =
                      assistantMessageElement.querySelector(
                        ".techsurf-message-text"
                      ) || assistantMessageElement;
                    if (messageTextEl) {
                      messageTextEl.textContent = accumulatedContent + "|"; // Add cursor
                    }
                  }

                  // Auto-scroll
                  this.scrollToBottom();
                } else if (parsed.type === "done") {
                  // Final content update
                  if (parsed.metadata?.fullContent) {
                    accumulatedContent = parsed.metadata.fullContent;
                  }

                  // Remove cursor and show final content
                  if (assistantMessageElement) {
                    const messageTextEl =
                      assistantMessageElement.querySelector(
                        ".techsurf-message-text"
                      ) || assistantMessageElement;
                    if (messageTextEl) {
                      messageTextEl.textContent = accumulatedContent;
                    }
                  }

                  console.log(
                    "✅ Streaming message complete:",
                    accumulatedContent
                  );

                  if (this.options.onMessage) {
                    this.options.onMessage({
                      id: parsed.id || Date.now().toString(),
                      content: accumulatedContent,
                      role: "assistant",
                      timestamp: new Date(),
                    });
                  }

                  return;
                } else if (parsed.type === "error") {
                  throw new Error(parsed.error || "Streaming error");
                }
              } catch (parseError) {
                // Ignore parsing errors for SSE metadata lines
                if (data.includes("id:") || data.includes("event:")) {
                  continue;
                }
                console.warn("SSE parse error:", parseError, "Data:", data);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    }

    addMessage(role, content) {
      // Remove empty state if it exists
      const emptyState = this.messagesContainer.querySelector(
        ".techsurf-empty-state"
      );
      if (emptyState) {
        emptyState.remove();
      }

      const messageDiv = document.createElement("div");
      messageDiv.className = `techsurf-message ${role}`;
      messageDiv.textContent = content;

      this.messagesContainer.appendChild(messageDiv);
      this.scrollToBottom();

      // Store message
      this.messages.push({ role, content, timestamp: new Date() });
    }

    showLoading() {
      const loadingDiv = document.createElement("div");
      loadingDiv.className = "techsurf-message loading";
      loadingDiv.innerHTML = `
        <div class="techsurf-loading-dots">
          <div class="techsurf-loading-dot"></div>
          <div class="techsurf-loading-dot"></div>
          <div class="techsurf-loading-dot"></div>
        </div>
        <span>AI is thinking...</span>
      `;

      this.messagesContainer.appendChild(loadingDiv);
      this.scrollToBottom();
    }

    hideLoading() {
      const loading = this.messagesContainer.querySelector(
        ".techsurf-message.loading"
      );
      if (loading) {
        loading.remove();
      }
    }

    scrollToBottom() {
      setTimeout(() => {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
      }, 100);
    }

    // Public methods
    destroy() {
      if (this.container) {
        this.container.remove();
      }
    }

    clearMessages() {
      this.messages = [];
      this.messagesContainer.innerHTML = `
        <div class="techsurf-empty-state">
          <div class="techsurf-empty-icon">💬</div>
          <div>Hi! I'm your AI assistant.<br>How can I help you today?</div>
        </div>
      `;
    }
  }

  // Export to global scope
  window.TechSurfChatWidget = TechSurfChatWidget;

  // Auto-init if data attributes are found
  document.addEventListener("DOMContentLoaded", () => {
    const autoInit = document.querySelector("[data-techsurf-chat]");
    if (autoInit) {
      const options = {
        apiUrl: autoInit.dataset.apiUrl,
        title: autoInit.dataset.title,
        placeholder: autoInit.dataset.placeholder,
        useContentstack: autoInit.dataset.useContentstack !== "false",
      };

      new TechSurfChatWidget(options);
    }
  });
})();

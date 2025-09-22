// src/components/ChatInput.tsx
import React, {
  useState,
  useRef,
  useEffect,
  KeyboardEvent,
  FormEvent,
} from "react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  showSendButton?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message...",
  maxLength = 2000,
  showSendButton = true,
}) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 120; // Maximum height in pixels
      textarea.style.height = Math.min(scrollHeight, maxHeight) + "px";
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const handleSend = (e?: FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled && trimmedMessage.length <= maxLength) {
      onSendMessage(trimmedMessage);
      setMessage("");

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }

    if (e.key === "Escape") {
      setMessage("");
      textareaRef.current?.blur();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      setMessage(newValue);
    }
  };

  const canSend =
    message.trim().length > 0 && !disabled && message.length <= maxLength;

  return (
    <form
      className="techsurf-chat-input-container"
      onSubmit={handleSend}
      ref={formRef}
    >
      <div className="techsurf-input-wrapper">
        <textarea
          ref={textareaRef}
          className="techsurf-message-input"
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Connecting..." : placeholder}
          disabled={disabled}
          rows={1}
          aria-label="Type your message"
        />

        <div className="techsurf-input-actions">
          {maxLength > 0 && (
            <div
              className={`techsurf-char-counter ${
                message.length > maxLength * 0.9 ? "techsurf-char-warning" : ""
              }`}
            >
              {message.length}/{maxLength}
            </div>
          )}

          {showSendButton && (
            <button
              type="submit"
              className="techsurf-send-button"
              disabled={!canSend}
              aria-label="Send message"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="techsurf-send-icon"
                aria-hidden="true"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22,2 15,22 11,13 2,9 22,2" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="techsurf-input-hint">
        Press Enter to send, Shift+Enter for new line, Esc to clear
      </div>
    </form>
  );
};

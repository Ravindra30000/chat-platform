// src/components/ChatHeader.tsx
import React from "react";

interface ChatHeaderProps {
  title: string;
  subtitle?: string | undefined;
  onMinimize?: (() => void) | undefined;
  onClose?: (() => void) | undefined;
  isConnected?: boolean | undefined;
  isLoading?: boolean | undefined;
  showConnectionStatus?: boolean | undefined;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  title,
  subtitle,
  onMinimize,
  onClose,
  isConnected = false,
  isLoading = false,
  showConnectionStatus = true,
}) => {
  const getConnectionStatus = () => {
    if (isLoading)
      return { text: "Connecting...", className: "techsurf-connecting" };
    if (isConnected) return { text: "Online", className: "techsurf-connected" };
    return { text: "Offline", className: "techsurf-disconnected" };
  };

  const connectionStatus = getConnectionStatus();

  return (
    <header className="techsurf-chat-header">
      <div className="techsurf-header-content">
        <div className="techsurf-header-info">
          <h3 className="techsurf-chat-title">{title}</h3>
          {subtitle && <p className="techsurf-chat-subtitle">{subtitle}</p>}
          {showConnectionStatus && (
            <div className="techsurf-connection-status">
              <div
                className={`techsurf-status-dot ${connectionStatus.className}`}
              />
              <span className="techsurf-status-text">
                {connectionStatus.text}
              </span>
            </div>
          )}
        </div>

        <div className="techsurf-header-actions">
          {onMinimize && (
            <button
              className="techsurf-header-button techsurf-minimize-button"
              onClick={onMinimize}
              aria-label="Minimize chat"
              type="button"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          )}

          {onClose && (
            <button
              className="techsurf-header-button techsurf-close-button"
              onClick={onClose}
              aria-label="Close chat"
              type="button"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

// src/components/LoadingIndicator.tsx
import React from "react";

interface LoadingIndicatorProps {
  message?: string;
  className?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = "AI is thinking...",
  className = "",
}) => {
  return (
    <div className={`techsurf-loading-indicator ${className}`}>
      <div className="techsurf-loading-dots">
        <div className="techsurf-dot"></div>
        <div className="techsurf-dot"></div>
        <div className="techsurf-dot"></div>
      </div>
      <span className="techsurf-loading-message">{message}</span>
    </div>
  );
};

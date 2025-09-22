// src/hooks/useTheme.ts
import { useMemo } from "react";
import { Theme } from "../types";

const defaultTheme: Theme = {
  primaryColor: "#007bff",
  fontFamily:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  borderRadius: "8px",
  backgroundColor: "#ffffff",
  textColor: "#333333",
  inputBorderColor: "#e1e5e9",
  headerColor: "#007bff",
  userMessageColor: "#007bff",
  assistantMessageColor: "#f8f9fa",
};

export const useTheme = (customTheme?: Partial<Theme>) => {
  const theme = useMemo(
    () => ({
      ...defaultTheme,
      ...customTheme,
    }),
    [customTheme]
  );

  const cssVariables = useMemo(
    () =>
      ({
        "--techsurf-chat-primary-color": theme.primaryColor,
        "--techsurf-chat-font-family": theme.fontFamily,
        "--techsurf-chat-border-radius": theme.borderRadius,
        "--techsurf-chat-bg-color": theme.backgroundColor,
        "--techsurf-chat-text-color": theme.textColor,
        "--techsurf-chat-input-border-color": theme.inputBorderColor,
        "--techsurf-chat-header-color": theme.headerColor,
        "--techsurf-chat-user-message-color": theme.userMessageColor,
        "--techsurf-chat-assistant-message-color": theme.assistantMessageColor,
      } as React.CSSProperties),
    [theme]
  );

  return { theme, cssVariables };
};

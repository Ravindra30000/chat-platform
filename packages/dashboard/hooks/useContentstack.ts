"use client";

import { useState, useEffect } from "react";
import { ContentstackContentType } from "@/lib/types";

export function useContentstack() {
  const [contentTypes, setContentTypes] = useState<ContentstackContentType[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    try {
      setIsLoading(true);

      // Check if authenticated with Contentstack
      const authResponse = await fetch("/api/contentstack/auth-status");
      const authData = await authResponse.json();

      setIsAuthenticated(authData.authenticated);

      if (authData.authenticated) {
        await fetchContentTypes();
      }
    } catch (err) {
      setError("Failed to check Contentstack authentication");
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContentTypes = async () => {
    try {
      const response = await fetch("/api/contentstack/content-types");

      if (!response.ok) {
        throw new Error("Failed to fetch content types");
      }

      const data = await response.json();
      setContentTypes(data.contentTypes || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch content types"
      );
      setContentTypes([]);
    }
  };

  const searchContent = async (query: string, contentTypes?: string[]) => {
    try {
      const params = new URLSearchParams({
        query,
        ...(contentTypes && { contentTypes: JSON.stringify(contentTypes) }),
      });

      const response = await fetch(`/api/contentstack/search?${params}`);

      if (!response.ok) {
        throw new Error("Failed to search content");
      }

      return await response.json();
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to search content"
      );
    }
  };

  const authenticate = () => {
    window.location.href = "/api/auth";
  };

  return {
    contentTypes,
    isLoading,
    error,
    isAuthenticated,
    searchContent,
    authenticate,
    refetch: checkAuthAndFetch,
  };
}

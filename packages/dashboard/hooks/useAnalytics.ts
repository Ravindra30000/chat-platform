"use client";

import { useState, useEffect } from "react";
import { AnalyticsData } from "@/lib/types";

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/analytics");

        if (!response.ok) {
          throw new Error("Failed to fetch analytics");
        }

        const analyticsData = await response.json();
        setData(analyticsData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch analytics"
        );
        // Provide mock data for development
        setData({
          totalConversations: 0,
          totalMessages: 0,
          averageResponseTime: 0,
          satisfactionScore: 0,
          usageOverTime: [],
          topAgents: [],
          recentConversations: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return { data, isLoading, error };
}

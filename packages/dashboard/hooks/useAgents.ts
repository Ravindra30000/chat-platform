"use client";

import { useState, useEffect } from "react";
import { AgentConfig } from "@/lib/types";
import { useSession } from "next-auth/react";

export function useAgents() {
  const { data: session } = useSession();
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setAgents([]);
      setIsLoading(false);
      return;
    }

    fetchAgents();
  }, [session]);

  const fetchAgents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/agents");

      if (!response.ok) {
        throw new Error("Failed to fetch agents");
      }

      const data = await response.json();
      setAgents(data.agents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch agents");
      setAgents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createAgent = async (
    agentConfig: Omit<
      AgentConfig,
      | "id"
      | "userId"
      | "createdAt"
      | "updatedAt"
      | "totalConversations"
      | "totalMessages"
      | "averageResponseTime"
      | "lastUsed"
    >
  ) => {
    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agentConfig),
      });

      if (!response.ok) {
        throw new Error("Failed to create agent");
      }

      const data = await response.json();
      setAgents((prev) => [data.agent, ...prev]);
      return data.agent;
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to create agent"
      );
    }
  };

  const updateAgent = async (id: string, updates: Partial<AgentConfig>) => {
    try {
      const response = await fetch(`/api/agents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update agent");
      }

      setAgents((prev) =>
        prev.map((agent) =>
          agent.id === id
            ? { ...agent, ...updates, updatedAt: new Date() }
            : agent
        )
      );
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to update agent"
      );
    }
  };

  const deleteAgent = async (id: string) => {
    try {
      const response = await fetch(`/api/agents/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete agent");
      }

      setAgents((prev) => prev.filter((agent) => agent.id !== id));
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to delete agent"
      );
    }
  };

  return {
    agents,
    isLoading,
    error,
    createAgent,
    updateAgent,
    deleteAgent,
    refetch: fetchAgents,
  };
}

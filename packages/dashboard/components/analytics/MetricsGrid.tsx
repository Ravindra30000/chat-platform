"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageCircle, Users, Clock, TrendingUp } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

export function MetricsGrid() {
  const { data: analytics, isLoading } = useAnalytics();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      title: "Total Conversations",
      value: analytics?.totalConversations || 0,
      description: "All time conversations",
      icon: MessageCircle,
      color: "text-blue-600",
    },
    {
      title: "Total Messages",
      value: analytics?.totalMessages || 0,
      description: "Messages exchanged",
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Avg Response Time",
      value: `${analytics?.averageResponseTime || 0}ms`,
      description: "Average response time",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Satisfaction Score",
      value: `${((analytics?.satisfactionScore || 0) * 100).toFixed(1)}%`,
      description: "User satisfaction",
      icon: TrendingUp,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.title}
            </CardTitle>
            <metric.icon className={`h-4 w-4 ${metric.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <CardDescription>{metric.description}</CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

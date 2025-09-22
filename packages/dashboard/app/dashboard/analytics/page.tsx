import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MetricsGrid } from "@/components/analytics/MetricsGrid";
import { UsageChart } from "@/components/analytics/UsageChart";
import { ConversationsTable } from "@/components/analytics/ConversationsTable";
import { PerformanceChart } from "@/components/analytics/PerformanceChart";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">
          Track performance and usage of your chat agents
        </p>
      </div>

      <MetricsGrid />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Usage Over Time</CardTitle>
            <CardDescription>
              Messages and conversations in the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UsageChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response Performance</CardTitle>
            <CardDescription>
              Average response times and success rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PerformanceChart />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Conversations</CardTitle>
          <CardDescription>
            Latest chat interactions across all agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConversationsTable />
        </CardContent>
      </Card>
    </div>
  );
}

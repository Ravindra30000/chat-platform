typescript;
("use client");

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAnalytics } from "@/hooks/useAnalytics";
import { format } from "date-fns";

export function UsageChart() {
  const { data: analytics, isLoading } = useAnalytics();

  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const data = analytics?.usageOverTime || [];

  const formatXAxis = (tickItem: string) => {
    return format(new Date(tickItem), "MMM dd");
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={formatXAxis} />
          <YAxis />
          <Tooltip
            labelFormatter={(value) => format(new Date(value), "MMMM dd, yyyy")}
          />
          <Line
            type="monotone"
            dataKey="conversations"
            stroke="#8884d8"
            strokeWidth={2}
            name="Conversations"
          />
          <Line
            type="monotone"
            dataKey="messages"
            stroke="#82ca9d"
            strokeWidth={2}
            name="Messages"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

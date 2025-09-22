import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MetricsGrid } from "@/components/analytics/MetricsGrid";
import { UsageChart } from "@/components/analytics/UsageChart";
import { Button } from "@/components/ui/button";
import { Plus, MessageCircle, Users, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome to your TechSurf Chat Platform dashboard
          </p>
        </div>
        <Link href="/dashboard/agents/create">
          <Button size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Create Agent
          </Button>
        </Link>
      </div>

      <MetricsGrid />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
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
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/dashboard/agents/create">
              <Button variant="outline" className="w-full justify-start">
                <MessageCircle className="w-4 h-4 mr-2" />
                Create New Agent
              </Button>
            </Link>
            <Link href="/dashboard/integration">
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Integration Guide
              </Button>
            </Link>
            <Link href="/dashboard/analytics">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest conversations and agent interactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No recent activity</p>
            <p className="text-sm">Create your first agent to get started</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AgentCard } from "@/components/agents/AgentCard";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chat Agents</h1>
          <p className="text-gray-600 mt-1">
            Manage and configure your AI chat agents
          </p>
        </div>
        <Link href="/dashboard/agents/create">
          <Button size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Create Agent
          </Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder="Search agents..." className="pl-10" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder for when no agents exist */}
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plus className="w-12 h-12 text-gray-400 mb-4" />
            <CardTitle className="text-center text-gray-600 mb-2">
              Create Your First Agent
            </CardTitle>
            <CardDescription className="text-center mb-4">
              Get started by creating a new chat agent with Contentstack
              integration
            </CardDescription>
            <Link href="/dashboard/agents/create">
              <Button>Create Agent</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

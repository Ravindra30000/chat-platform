import { AgentBuilder } from "@/components/AgentBuilder";

export default function CreateAgentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Agent</h1>
        <p className="text-gray-600 mt-1">
          Build and configure your AI chat agent with Contentstack integration
        </p>
      </div>

      <AgentBuilder mode="create" />
    </div>
  );
}

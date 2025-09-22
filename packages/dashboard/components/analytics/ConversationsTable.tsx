typescript;
("use client");

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useAnalytics } from "@/hooks/useAnalytics";

export function ConversationsTable() {
  const { data: analytics, isLoading } = useAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse flex space-x-4 p-4">
            <div className="h-4 bg-gray-200 rounded flex-1"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  const recentConversations = analytics?.recentConversations || [];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Agent</TableHead>
          <TableHead>Messages</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Started</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recentConversations.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-gray-500 py-8">
              No conversations yet
            </TableCell>
          </TableRow>
        ) : (
          recentConversations.map((conversation: any) => (
            <TableRow key={conversation.id}>
              <TableCell className="font-medium">
                {conversation.userId || "Anonymous"}
              </TableCell>
              <TableCell>{conversation.agentName}</TableCell>
              <TableCell>{conversation.messageCount}</TableCell>
              <TableCell>
                {conversation.duration
                  ? `${Math.round(conversation.duration / 1000)}s`
                  : "-"}
              </TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(conversation.startTime), {
                  addSuffix: true,
                })}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    conversation.status === "completed"
                      ? "default"
                      : "secondary"
                  }
                >
                  {conversation.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

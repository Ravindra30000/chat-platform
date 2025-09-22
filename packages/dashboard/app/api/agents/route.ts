import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/database";
import { AgentConfig } from "@/lib/types";
import { z } from "zod";

const agentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  avatar: z.string().optional(),
  model: z.string().default("llama-3.1-8b-instant"),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(4096).default(2048),
  systemPrompt: z.string().min(1, "System prompt is required"),
  useContentstack: z.boolean().default(true),
  contentTypes: z.array(z.string()).default([]),
  maxContextLength: z.number().min(500).max(4000).default(2000),
  theme: z
    .object({
      primaryColor: z.string().default("#007bff"),
      fontFamily: z.string().default("Inter, sans-serif"),
      borderRadius: z.string().default("8px"),
      position: z
        .enum(["bottom-right", "bottom-left", "center"])
        .default("bottom-right"),
    })
    .default({}),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const agents = await db
      .collection("agents")
      .find({ userId: session.user.email })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ agents });
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = agentSchema.parse(body);

    const { db } = await connectToDatabase();
    const agentConfig: AgentConfig = {
      id: crypto.randomUUID(),
      ...validatedData,
      userId: session.user.email,
      totalConversations: 0,
      totalMessages: 0,
      averageResponseTime: 0,
      lastUsed: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("agents").insertOne(agentConfig);

    return NextResponse.json(
      {
        agent: { ...agentConfig, _id: result.insertedId },
        message: "Agent created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("Error creating agent:", error);
    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 }
    );
  }
}

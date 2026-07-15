import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/infrastructure/database/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
  if (!user) {
    return NextResponse.json({ conversations: [] });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const conversations = await prisma.conversation.findMany({
    where: {
      userId: user.id,
      ...(projectId === "all" ? {} : { projectId: projectId ?? null }),
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      title: true,
      name: true,
      createdAt: true,
      messages: {
        take: 1,
        orderBy: { createdAt: "asc" },
        select: { content: true },
      },
    },
  });

  return NextResponse.json({
    conversations: conversations.map((c) => ({
      id: c.id,
      title: c.name ?? c.title ?? "Conversación",
      preview: c.messages[0]?.content.slice(0, 80) ?? "",
      createdAt: c.createdAt,
    })),
  });
}

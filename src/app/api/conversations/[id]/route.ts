import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/infrastructure/database/prisma";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id, userId: user.id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: { role: true, content: true, createdAt: true },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    messages: conversation.messages.map((m) => ({
      role: m.role === "USER" ? "user" : "assistant",
      content: m.content,
      createdAt: m.createdAt,
    })),
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const conversation = await prisma.conversation.findFirst({
    where: { id, userId: user.id },
  });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.conversation.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const conversation = await prisma.conversation.findFirst({ where: { id, userId: user.id } });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name } = await req.json();
  const updated = await prisma.conversation.update({
    where: { id },
    data: { name: name?.trim() ?? conversation.name },
  });

  return NextResponse.json({ conversation: updated });
}

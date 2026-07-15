import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/infrastructure/database/prisma";

export const runtime = "nodejs";

async function getOrCreateUser(clerkUserId: string) {
  let user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
  if (!user) {
    user = await prisma.user.create({
      data: { clerkId: clerkUserId, email: `${clerkUserId}@clerk.local` },
    });
  }
  return user;
}

export async function GET() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getOrCreateUser(clerkUserId);

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      conversations: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { name: true, createdAt: true },
      },
    },
  });

  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const user = await getOrCreateUser(clerkUserId);

  const project = await prisma.project.create({
    data: { userId: user.id, name: name.trim() },
  });

  return NextResponse.json({ project }, { status: 201 });
}

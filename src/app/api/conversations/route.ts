import { desc } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { conversations } from '@/db/schema';

export const GET = async (_req: NextRequest): Promise<NextResponse> => {
  const rows = await db
    .select({ id: conversations.id, title: conversations.title, updatedAt: conversations.updatedAt })
    .from(conversations)
    .orderBy(desc(conversations.updatedAt));
  return NextResponse.json(rows);
};

export const POST = async (_req: NextRequest): Promise<NextResponse> => {
  const [row] = await db.insert(conversations).values({}).returning();
  return NextResponse.json(row, { status: 201 });
};

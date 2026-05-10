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
  const [last] = await db
    .select({
      systemPrompt: conversations.systemPrompt,
      temperature: conversations.temperature,
      endpoint: conversations.endpoint,
      modelName: conversations.modelName
    })
    .from(conversations)
    .orderBy(desc(conversations.createdAt))
    .limit(1);

  const [row] = await db.insert(conversations).values(last ?? {}).returning();
  return NextResponse.json(row, { status: 201 });
};

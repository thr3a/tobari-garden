import { asc, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { messages } from '@/db/schema';

type Params = { params: Promise<{ id: string }> };

export const GET = async (_req: NextRequest, { params }: Params): Promise<NextResponse> => {
  const { id } = await params;
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, Number(id)))
    .orderBy(asc(messages.createdAt));
  return NextResponse.json({ status: 'ok', result: rows });
};

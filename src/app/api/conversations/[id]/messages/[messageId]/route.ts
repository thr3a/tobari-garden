import { and, eq, gt } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { messages } from '@/db/schema';

type Params = { params: Promise<{ id: string; messageId: string }> };

export const PATCH = async (req: NextRequest, { params }: Params): Promise<NextResponse> => {
  const { id, messageId } = await params;
  const { content } = await req.json();

  const [updated] = await db
    .update(messages)
    .set({ content })
    .where(and(eq(messages.conversationId, Number(id)), eq(messages.id, Number(messageId))))
    .returning();

  return NextResponse.json({ status: 'ok', result: updated });
};

// 指定IDより後のメッセージを削除
export const DELETE = async (_req: NextRequest, { params }: Params): Promise<NextResponse> => {
  const { id, messageId } = await params;

  await db.delete(messages).where(and(eq(messages.conversationId, Number(id)), gt(messages.id, Number(messageId))));

  return NextResponse.json({ status: 'ok' });
};

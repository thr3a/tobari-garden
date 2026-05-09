import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/client';
import { conversations } from '@/db/schema';

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  title: z.string().optional(),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  endpoint: z.string().url().optional(),
  modelName: z.string().optional()
});

export const GET = async (_req: NextRequest, { params }: Params): Promise<NextResponse> => {
  const { id } = await params;
  const [row] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, Number(id)));
  if (!row) return NextResponse.json({ status: 'ng', error: 'Not found' }, { status: 404 });
  return NextResponse.json({ status: 'ok', result: row });
};

export const PATCH = async (req: NextRequest, { params }: Params): Promise<NextResponse> => {
  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ status: 'ng', errors: parsed.error.issues }, { status: 400 });
  }
  const [row] = await db
    .update(conversations)
    .set(parsed.data)
    .where(eq(conversations.id, Number(id)))
    .returning();
  return NextResponse.json({ status: 'ok', result: row });
};

export const DELETE = async (_req: NextRequest, { params }: Params): Promise<NextResponse> => {
  const { id } = await params;
  await db.delete(conversations).where(eq(conversations.id, Number(id)));
  return NextResponse.json({ status: 'ok' });
};

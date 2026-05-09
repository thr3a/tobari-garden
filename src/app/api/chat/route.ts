import { createOpenAI } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, type UIMessage } from 'ai';
import { eq, sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/client';
import { conversations, messages } from '@/db/schema';

const requestSchema = z.object({
  messages: z.array(z.custom<UIMessage>()),
  conversationId: z.number().int().positive()
});

export const POST = async (req: NextRequest): Promise<Response> => {
  const body = await req.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ status: 'ng', errors: parsed.error.issues }, { status: 400 });
  }

  const { messages: uiMessages, conversationId } = parsed.data;

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, conversationId));
  if (!conv) {
    return NextResponse.json({ status: 'ng', error: 'Conversation not found' }, { status: 404 });
  }

  const lastUserMessage = uiMessages.at(-1);
  if (!lastUserMessage || lastUserMessage.role !== 'user') {
    return NextResponse.json({ status: 'ng', error: 'Last message must be from user' }, { status: 400 });
  }

  const userText = lastUserMessage.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('');

  await db.insert(messages).values({ conversationId, role: 'user', content: userText });

  if (!conv.title) {
    await db
      .update(conversations)
      .set({ title: userText.slice(0, 50) })
      .where(eq(conversations.id, conversationId));
  }

  const openai = createOpenAI({ baseURL: conv.endpoint, apiKey: 'local' });

  const modelMessages = await convertToModelMessages(uiMessages);
  const result = streamText({
    model: openai.chat(conv.modelName),
    messages: modelMessages,
    system: conv.systemPrompt || undefined,
    temperature: conv.temperature,
    onFinish: async ({ text }) => {
      await db.insert(messages).values({ conversationId, role: 'assistant', content: text });
      await db
        .update(conversations)
        .set({ updatedAt: sql`(datetime('now', 'localtime'))` })
        .where(eq(conversations.id, conversationId));
    }
  });

  return result.toUIMessageStreamResponse({ originalMessages: uiMessages });
};

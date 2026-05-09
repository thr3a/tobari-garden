import { sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const conversations = sqliteTable('conversations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull().default(''),
  systemPrompt: text('system_prompt').notNull().default(''),
  temperature: real('temperature').notNull().default(1.0),
  endpoint: text('endpoint').notNull().default('https://chatgpt-api.turai.work/v1'),
  modelName: text('model_name').notNull().default('deep01-reasoning-off'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now', 'localtime'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now', 'localtime'))`)
});

export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  conversationId: integer('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'assistant'] }).notNull(),
  content: text('content').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now', 'localtime'))`)
});

export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;

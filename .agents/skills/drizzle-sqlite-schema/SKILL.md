---
name: drizzle-sqlite-schema
description: Drizzle ORM を使ったスキーマ変更（カラム追加・テーブル追加）の手順。このプロジェクトは SQLite (better-sqlite3) + drizzle-kit push 構成。
---

## 構成

- ORM: Drizzle ORM / DB: SQLite (better-sqlite3 / ローカルファイル)
- DBファイル: `DATABASE_PATH` 環境変数 or デフォルト `./local.db`
- スキーマファイル: `src/db/schema.ts`
- DBクライアント: `src/db/client.ts`（`drizzle-orm/better-sqlite3` を使用）
- DB反映: `npm run db:push`（マイグレーションファイルは生成しない）

---

## カラム追加

`src/db/schema.ts` の対象テーブルにカラムを追記する。

```ts
export const conversations = sqliteTable('conversations', {
  // ...既存カラム...
  memo: text('memo').default(''),  // ← 追加
});
```

`$inferSelect` で型を自動推論しているため、カラム追加で型も自動更新される。

---

## テーブル追加

`src/db/schema.ts` に新しいテーブルと型を追記する。

```ts
export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now', 'localtime'))`),
});

export type Tag = typeof tags.$inferSelect;
```

---

## DB反映・確認

カラム削除・型変更は破壊的変更のため、`db:push` 実行時に確認プロンプトが表示される。

```bash
npm run db:push    # スキーマをDBに適用
```

# SQLite テーブル設計仕様書

## 概要

ローカル LLM チャットツールのデータを SQLite で永続化するためのテーブル設計。

---

## テーブル一覧

| テーブル名 | 説明 |
|---|---|
| `conversations` | チャット履歴（サイドバーに表示される会話単位） |
| `messages` | 各会話に紐づくメッセージ一覧 |

---

## `conversations` テーブル

チャット履歴1件 = 1会話。設定（システムプロンプト等）は会話ごとに保持する。

```sql
CREATE TABLE conversations (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT    NOT NULL DEFAULT '',
  system_prompt TEXT    NOT NULL DEFAULT '',
  temperature   REAL    NOT NULL DEFAULT 1.0,
  endpoint      TEXT    NOT NULL DEFAULT 'http://localhost:11434/v1',
  model_name    TEXT    NOT NULL DEFAULT 'llama3',
  created_at    TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);
```

### カラム説明

| カラム名 | 型 | 説明 |
|---|---|---|
| `id` | INTEGER | 主キー（自動採番） |
| `title` | TEXT | サイドバーに表示するタイトル。最初のユーザーメッセージから自動生成を想定 |
| `system_prompt` | TEXT | AIへの指示（設定モーダルで編集） |
| `temperature` | REAL | 生成のランダム性（0〜2） |
| `endpoint` | TEXT | ローカル LLM の API エンドポイント |
| `model_name` | TEXT | 使用するモデル名 |
| `created_at` | TEXT | 作成日時（ISO8601形式） |
| `updated_at` | TEXT | 最終更新日時。メッセージ追加時にも更新する |

---

## `messages` テーブル

会話に紐づくメッセージ。`conversation_id` で `conversations` と関連付ける。

```sql
CREATE TABLE messages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT    NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT    NOT NULL,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
```

### カラム説明

| カラム名 | 型 | 説明 |
|---|---|---|
| `id` | INTEGER | 主キー（自動採番） |
| `conversation_id` | INTEGER | 紐づく会話の ID（外部キー） |
| `role` | TEXT | 発言者。`'user'` または `'assistant'` のみ許容 |
| `content` | TEXT | メッセージ本文 |
| `created_at` | TEXT | 送信日時（ISO8601形式） |

---

## ER 図

```
conversations
  id            PK
  title
  system_prompt
  temperature
  endpoint
  model_name
  created_at
  updated_at
      |
      | 1 : N
      |
messages
  id            PK
  conversation_id  FK → conversations.id
  role
  content
  created_at
```

---

## 主要クエリ例

### サイドバー用：会話一覧を最終更新順で取得

```sql
SELECT id, title, updated_at
FROM conversations
ORDER BY updated_at DESC;
```

### チャット画面用：特定会話のメッセージを時系列で取得

```sql
SELECT id, role, content, created_at
FROM messages
WHERE conversation_id = ?
ORDER BY created_at ASC;
```

### 新規会話の作成

```sql
INSERT INTO conversations (title) VALUES ('');
-- 返却された id を使って以降のメッセージを紐付ける
```

### メッセージの追加 + 会話の updated_at を更新

```sql
INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?);

UPDATE conversations
SET updated_at = datetime('now', 'localtime')
WHERE id = ?;
```

### 会話のタイトルを更新（最初のユーザーメッセージから自動設定）

```sql
UPDATE conversations
SET title = substr(?, 1, 50)
WHERE id = ?;
```

### 会話の削除（メッセージも CASCADE で自動削除）

```sql
DELETE FROM conversations WHERE id = ?;
```

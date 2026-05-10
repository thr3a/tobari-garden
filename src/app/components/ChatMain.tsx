'use client';

import { useChat } from '@ai-sdk/react';
import {
  ActionIcon,
  Box,
  Button,
  Flex,
  Image,
  Loader,
  Modal,
  NumberInput,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  TextInput
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPencil, IconSend, IconSettings } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Conversation, Message } from '@/db/schema';

type ChatMainProps = {
  conversationId: number;
};

type EditingState = {
  messageId: string;
  content: string;
};

const CHARACTER_IMAGE = 'https://placehold.jp/400x400.png';

const toUiMessages = (dbMessages: Message[]): UIMessage[] =>
  dbMessages.map((message) => ({
    id: String(message.id),
    role: message.role,
    content: message.content,
    parts: [{ type: 'text', text: message.content }]
  }));

const getMessageText = (message: UIMessage): string =>
  message.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('');

export const ChatMain = ({ conversationId }: ChatMainProps) => {
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  const { data: conv } = useQuery<Conversation>({
    queryKey: ['conversation', conversationId],
    queryFn: () =>
      fetch(`/api/conversations/${conversationId}`)
        .then((r) => r.json())
        .then((j) => j.result)
  });

  const { data: dbMessages } = useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: () =>
      fetch(`/api/conversations/${conversationId}/messages`)
        .then((r) => r.json())
        .then((j) => j.result)
  });

  const updateConvMutation = useMutation({
    mutationFn: (patch: Partial<Conversation>) =>
      fetch(`/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
    }
  });

  const [settings, setSettings] = useState({
    systemPrompt: '',
    temperature: 1,
    endpoint: 'https://chatgpt-api.turai.work/v1',
    modelName: 'deep01-reasoning-off'
  });

  useEffect(() => {
    if (!conv) return;
    setSettings({
      systemPrompt: conv.systemPrompt,
      temperature: conv.temperature,
      endpoint: conv.endpoint,
      modelName: conv.modelName
    });
  }, [conv]);

  const [input, setInput] = useState('');

  const transport = useMemo(
    () => new DefaultChatTransport({ api: '/api/chat/', body: { conversationId } }),
    [conversationId]
  );

  const { messages, sendMessage, setMessages, status, regenerate } = useChat({
    transport,
    onFinish: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    }
  });

  const isStreaming = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    if (!dbMessages) return;
    if (isStreaming) return;
    setMessages(toUiMessages(dbMessages));
  }, [dbMessages, isStreaming, setMessages]);

  const lastMessageId = messages.at(-1)?.id;
  useEffect(() => {
    if (!lastMessageId) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lastMessageId]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage({ text: input.trim() });
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSettingsSave = () => {
    updateConvMutation.mutate({
      systemPrompt: settings.systemPrompt,
      temperature: settings.temperature,
      endpoint: settings.endpoint,
      modelName: settings.modelName
    });
    closeSettings();
  };

  const startEditing = (message: UIMessage) => {
    setEditingState({ messageId: message.id, content: getMessageText(message) });
  };

  const handleEditSubmit = async (message: UIMessage) => {
    if (!editingState) return;
    const trimmed = editingState.content.trim();
    if (!trimmed) return;

    await fetch(`/api/conversations/${conversationId}/messages/${message.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: trimmed })
    });

    const idx = messages.findIndex((m) => m.id === message.id);
    const updatedMessage: UIMessage = {
      id: message.id,
      role: message.role,
      metadata: message.metadata,
      parts: [{ type: 'text', text: trimmed }]
    };

    if (message.role === 'user') {
      await fetch(`/api/conversations/${conversationId}/messages/${message.id}`, {
        method: 'DELETE'
      });

      const truncated = [...messages.slice(0, idx), updatedMessage];
      setMessages(truncated);
      setEditingState(null);
      regenerate();
    } else {
      setMessages(messages.map((m) => (m.id === message.id ? updatedMessage : m)));
      setEditingState(null);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, message: UIMessage) => {
    if (e.key === 'Enter' && e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleEditSubmit(message);
    }
  };

  return (
    <Flex direction='column' flex={1} h='100%'>
      <Box ta='center' pt='lg' pb='md' style={{ flexShrink: 0 }}>
        <Image src={CHARACTER_IMAGE} alt='AIキャラクター' w={120} h={120} mx='auto' />
      </Box>

      <ScrollArea flex={1} px='md' viewportRef={scrollRef}>
        <Stack gap='md' pb='md' maw={800} mx='auto'>
          {messages.map((message) => {
            const isEditing = editingState?.messageId === message.id;
            const isHovered = hoveredMessageId === message.id;
            const isUser = message.role === 'user';

            return (
              <Flex
                key={message.id}
                justify={isUser ? 'flex-end' : 'flex-start'}
                align='flex-end'
                gap='xs'
                onMouseEnter={() => setHoveredMessageId(message.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
              >
                {isUser && !isEditing && isHovered && !editingState && (
                  <ActionIcon size='sm' variant='subtle' c='gray.5' onClick={() => startEditing(message)}>
                    <IconPencil size={14} />
                  </ActionIcon>
                )}

                <Box
                  maw={isEditing ? '80%' : '70%'}
                  w={isEditing ? '80%' : undefined}
                  px='md'
                  py='sm'
                  bg={isUser ? 'blue.6' : 'gray.1'}
                  c={isUser ? 'white' : 'dark.8'}
                  style={{ borderRadius: 12 }}
                >
                  {isEditing ? (
                    <Stack gap='xs'>
                      <Textarea
                        value={editingState.content}
                        onChange={(e) => {
                          const value = e.currentTarget.value;
                          setEditingState((prev) => (prev ? { ...prev, content: value } : null));
                        }}
                        onKeyDown={(e) => handleEditKeyDown(e, message)}
                        minRows={2}
                        maxRows={10}
                        autosize
                        autoFocus
                        styles={{
                          input: {
                            color: isUser ? 'white' : undefined,
                            backgroundColor: isUser ? 'var(--mantine-color-blue-7)' : undefined
                          }
                        }}
                      />
                      <Flex gap='xs' justify='flex-end'>
                        <Button
                          size='xs'
                          variant='subtle'
                          c={isUser ? 'white' : undefined}
                          onClick={() => setEditingState(null)}
                        >
                          キャンセル
                        </Button>
                        <Button
                          size='xs'
                          variant={isUser ? 'white' : 'filled'}
                          c={isUser ? 'blue.6' : undefined}
                          onClick={() => handleEditSubmit(message)}
                        >
                          送信
                        </Button>
                      </Flex>
                    </Stack>
                  ) : (
                    <Text size='sm' style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {getMessageText(message)}
                    </Text>
                  )}
                </Box>

                {!isUser && !isEditing && isHovered && !editingState && (
                  <ActionIcon size='sm' variant='subtle' c='gray.5' onClick={() => startEditing(message)}>
                    <IconPencil size={14} />
                  </ActionIcon>
                )}
              </Flex>
            );
          })}
          {isStreaming && (
            <Flex justify='flex-start'>
              <Loader size='sm' type='dots' />
            </Flex>
          )}
        </Stack>
      </ScrollArea>

      <Box p='md' style={{ flexShrink: 0 }}>
        <Flex gap='xs' align='flex-end' maw={800} mx='auto'>
          <ActionIcon size='lg' variant='subtle' onClick={openSettings}>
            <IconSettings size={18} />
          </ActionIcon>
          <Textarea
            flex={1}
            placeholder='メッセージを入力... (Enterで送信、Shift+Enterで改行)'
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            minRows={1}
            maxRows={5}
            autosize
            disabled={isStreaming}
          />
          <ActionIcon size='lg' variant='filled' onClick={handleSend} disabled={!input.trim() || isStreaming}>
            <IconSend size={16} />
          </ActionIcon>
        </Flex>
      </Box>

      <Modal```````````` opened={settingsOpened} onClose={closeSettings} title='設定' centered>
        <Stack gap='md'>
          <Textarea
            label='システムプロンプト'
            placeholder='AIへの指示を入力...'
            value={settings.systemPrompt}
            onChange={(e) => setSettings((prev) => ({ ...prev, systemPrompt: e.target.value }))}
            minRows={20}
            autosize
          />
          <NumberInput
            label='Temperature'
            description='生成のランダム性 (0〜2)'
            value={settings.temperature}
            onChange={(val) => setSettings((prev) => ({ ...prev, temperature: typeof val === 'number' ? val : 1 }))}
            min={0}
            max={2}
            step={0.1}
            decimalScale={1}
          />
          <TextInput
            label='ローカルLLM エンドポイント'
            placeholder='http://localhost:11434/v1'
            value={settings.endpoint}
            onChange={(e) => {
              const v = e.currentTarget.value;
              setSettings((prev) => ({ ...prev, endpoint: v }));
            }}
          />
          <TextInput
            label='使用するモデル名'
            placeholder='llama3'
            value={settings.modelName}
            onChange={(e) => {
              const v = e.currentTarget.value;
              setSettings((prev) => ({ ...prev, modelName: v }));
            }}
          />
          <Button variant='filled' fullWidth onClick={handleSettingsSave} loading={updateConvMutation.isPending}>
            保存
          </Button>
        </Stack>
      </Modal>
    </Flex>
  );
};

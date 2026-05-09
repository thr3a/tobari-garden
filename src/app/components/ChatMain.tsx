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
import { IconSend, IconSettings } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Conversation, Message } from '@/db/schema';

type ChatMainProps = {
  conversationId: number;
};

const CHARACTER_IMAGE = 'https://placehold.jp/400x400.png';

export const ChatMain = ({ conversationId }: ChatMainProps) => {
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);
  const [initialized, setInitialized] = useState(false);

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

  const { messages, sendMessage, setMessages, status } = useChat({
    transport,
    onFinish: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  useEffect(() => {
    if (initialized || !dbMessages) return;
    const uiMessages: UIMessage[] = dbMessages.map((m) => ({
      id: String(m.id),
      role: m.role,
      content: m.content,
      parts: [{ type: 'text' as const, text: m.content }]
    }));
    setMessages(uiMessages);
    setInitialized(true);
  }, [dbMessages, initialized, setMessages]);

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
    if (e.key === 'Enter' && !e.shiftKey) {
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

  const isStreaming = status === 'submitted' || status === 'streaming';

  return (
    <Flex direction='column' flex={1} h='100%'>
      <Box ta='center' pt='lg' pb='md' style={{ flexShrink: 0 }}>
        <Image src={CHARACTER_IMAGE} alt='AIキャラクター' w={120} h={120} mx='auto' />
      </Box>

      <ScrollArea flex={1} px='md' viewportRef={scrollRef}>
        <Stack gap='md' pb='md' maw={800} mx='auto'>
          {messages.map((message) => (
            <Flex
              key={message.id}
              justify={message.role === 'user' ? 'flex-end' : 'flex-start'}
              align='flex-end'
              gap='xs'
            >
              <Box
                maw='70%'
                px='md'
                py='sm'
                bg={message.role === 'user' ? 'blue.6' : 'gray.1'}
                c={message.role === 'user' ? 'white' : 'dark.8'}
                style={{ borderRadius: 12 }}
              >
                <Text size='sm' style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {message.parts
                    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
                    .map((p) => p.text)
                    .join('')}
                </Text>
              </Box>
            </Flex>
          ))}
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

      <Modal opened={settingsOpened} onClose={closeSettings} title='設定' centered>
        <Stack gap='md'>
          <Textarea
            label='システムプロンプト'
            placeholder='AIへの指示を入力...'
            value={settings.systemPrompt}
            onChange={(e) => setSettings((prev) => ({ ...prev, systemPrompt: e.currentTarget.value }))}
            minRows={3}
            maxRows={6}
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

'use client';

import {
  ActionIcon,
  Box,
  Flex,
  Image,
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
import { useRef, useState } from 'react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type Settings = {
  systemPrompt: string;
  temperature: number;
  endpoint: string;
  modelName: string;
};

const DEFAULT_SETTINGS: Settings = {
  systemPrompt: '',
  temperature: 1,
  endpoint: 'http://localhost:11434/v1',
  modelName: 'llama3'
};

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'こんにちは！私はあなたのAIアシスタントです。何かお手伝いできることはありますか？'
  },
  { id: '2', role: 'user', content: '今日の気分はどうですか？' },
  {
    id: '3',
    role: 'assistant',
    content: '今日もとても元気です！あなたのおかげで毎日楽しく過ごせています。今日は何か話したいことがありますか？'
  }
];

const CHARACTER_IMAGE = 'https://placehold.jp/400x400.png';

export const ChatMain = () => {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: String(Date.now()),
      role: 'user',
      content: input.trim()
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // モック: 少し遅れてアシスタントが返答
    setTimeout(() => {
      const assistantMessage: Message = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: 'なるほど、興味深いですね！もう少し詳しく教えてもらえますか？'
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Flex direction='column' flex={1} h='100%'>
      {/* キャラクター顔写真 */}
      <Box ta='center' pt='lg' pb='md' style={{ flexShrink: 0 }}>
        <Image src={CHARACTER_IMAGE} alt='AIキャラクター' w={120} h={120} mx='auto' />
      </Box>

      {/* チャットメッセージ */}
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
                  {message.content}
                </Text>
              </Box>
            </Flex>
          ))}
        </Stack>
      </ScrollArea>

      {/* 入力エリア */}
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
          />
          <ActionIcon size='lg' variant='filled' onClick={handleSend} disabled={!input.trim()}>
            <IconSend size={16} />
          </ActionIcon>
        </Flex>
      </Box>

      {/* 設定モーダル */}
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
            onChange={(e) => setSettings((prev) => ({ ...prev, endpoint: e.currentTarget.value }))}
          />
          <TextInput
            label='使用するモデル名'
            placeholder='llama3'
            value={settings.modelName}
            onChange={(e) => setSettings((prev) => ({ ...prev, modelName: e.currentTarget.value }))}
          />
        </Stack>
      </Modal>
    </Flex>
  );
};

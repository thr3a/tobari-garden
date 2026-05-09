'use client';

import { ActionIcon, Box, Button, Flex, ScrollArea, Stack, Text } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';

type ChatHistory = {
  id: string;
  title: string;
  updatedAt: string;
};

const MOCK_HISTORIES: ChatHistory[] = [
  { id: '1', title: '今日の天気について', updatedAt: '2026-05-09' },
  { id: '2', title: '好きな食べ物を教えて', updatedAt: '2026-05-08' },
  { id: '3', title: 'おすすめの映画は？', updatedAt: '2026-05-07' },
  { id: '4', title: '最近のニュース', updatedAt: '2026-05-06' },
  { id: '5', title: '旅行の計画を立てて', updatedAt: '2026-05-05' }
];

type SidebarProps = {
  activeId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
};

export const Sidebar = ({ activeId, onSelect, onNew }: SidebarProps) => {
  return (
    <Box w={240} h='100%' style={{ flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      <Box p='sm'>
        <Button leftSection={<IconPlus size={16} />} variant='light' fullWidth onClick={onNew}>
          新しいチャット
        </Button>
      </Box>

      <ScrollArea flex={1} px='xs'>
        <Stack gap={4}>
          {MOCK_HISTORIES.map((history) => (
            <Flex
              key={history.id}
              align='center'
              gap='xs'
              px='sm'
              py='xs'
              style={{
                cursor: 'pointer',
                borderRadius: 4,
                fontWeight: activeId === history.id ? 'bold' : undefined
              }}
              onClick={() => onSelect(history.id)}
            >
              <Box flex={1} style={{ overflow: 'hidden' }}>
                <Text size='sm' style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {history.title}
                </Text>
                <Text size='xs'>{history.updatedAt}</Text>
              </Box>
              <ActionIcon
                variant='subtle'
                size='sm'
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <IconTrash size={12} />
              </ActionIcon>
            </Flex>
          ))}
        </Stack>
      </ScrollArea>
    </Box>
  );
};

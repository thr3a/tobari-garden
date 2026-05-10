'use client';

import { ActionIcon, Box, Button, Flex, ScrollArea, Stack, Text } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Conversation } from '@/db/schema';

type SidebarProps = {
  activeId: number | null;
  onSelect: (id: number) => void;
};

export const Sidebar = ({ activeId, onSelect }: SidebarProps) => {
  const queryClient = useQueryClient();

  const { data: conversations = [] } = useQuery<Pick<Conversation, 'id' | 'title' | 'updatedAt'>[]>({
    queryKey: ['conversations'],
    queryFn: () => fetch('/api/conversations').then((r) => r.json())
  });

  const createMutation = useMutation({
    mutationFn: () => fetch('/api/conversations', { method: 'POST' }).then((r) => r.json()) as Promise<Conversation>,
    onSuccess: (conv) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      onSelect(conv.id);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/conversations/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  return (
    <Box w={240} h='100%' style={{ flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      <Box p='sm'>
        <Button
          leftSection={<IconPlus size={16} />}
          variant='light'
          fullWidth
          onClick={() => createMutation.mutate()}
          loading={createMutation.isPending}
        >
          新しいチャット
        </Button>
      </Box>

      <ScrollArea flex={1} px='xs'>
        <Stack gap={4}>
          {conversations.map((conv) => (
            <Flex
              key={conv.id}
              align='center'
              gap='xs'
              px='sm'
              py='xs'
              bg={activeId === conv.id ? 'blue.1' : undefined}
              style={{
                cursor: 'pointer',
                borderRadius: 4,
                fontWeight: activeId === conv.id ? 'bold' : undefined
              }}
              onClick={() => onSelect(conv.id)}
            >
              <Box flex={1} style={{ overflow: 'hidden' }}>
                <Text size='sm' style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {conv.title || '新しいチャット'}
                </Text>
                <Text size='xs'>{conv.updatedAt?.slice(0, 10)}</Text>
              </Box>
              <ActionIcon
                variant='subtle'
                size='sm'
                onClick={(e) => {
                  e.stopPropagation();
                  if (!window.confirm('このチャットを削除しますか？')) return;
                  deleteMutation.mutate(conv.id);
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

'use client';

import { Flex } from '@mantine/core';
import { useState } from 'react';
import { ChatMain } from './components/ChatMain';
import { Sidebar } from './components/Sidebar';

export default function Page() {
  const [activeId, setActiveId] = useState<number | null>(null);

  return (
    <Flex h='100vh' style={{ overflow: 'hidden' }}>
      <Sidebar activeId={activeId} onSelect={setActiveId} />
      {activeId !== null && <ChatMain key={activeId} conversationId={activeId} />}
    </Flex>
  );
}

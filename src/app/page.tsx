'use client';

import { Flex } from '@mantine/core';
import { useState } from 'react';
import { ChatMain } from './components/ChatMain';
import { Sidebar } from './components/Sidebar';

export default function Page() {
  const [activeHistoryId, setActiveHistoryId] = useState<string>('1');

  const handleNew = () => {
    setActiveHistoryId('');
  };

  return (
    <Flex h='100vh' style={{ overflow: 'hidden' }}>
      <Sidebar activeId={activeHistoryId} onSelect={setActiveHistoryId} onNew={handleNew} />
      <ChatMain />
    </Flex>
  );
}

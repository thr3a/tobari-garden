'use client';

import { Button } from '@mantine/core';
import Link from 'next/link';

export default function Page() {
  return (
    <main>
      <Button component={Link} href='/sample/fetch'>
        fetch
      </Button>
    </main>
  );
}

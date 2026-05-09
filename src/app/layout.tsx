import '@mantine/core/styles.css';

import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import type { Metadata } from 'next';
import { Providers } from '@/providers';
import { theme } from '@/theme';

export const metadata: Metadata = {
  title: 'tobari garden',
  description: 'AIキャラクターとチャットできるWEBUI'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='ja' {...mantineHtmlProps}>
      <head>
        <meta name='viewport' content='minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no' />
        <ColorSchemeScript />
      </head>
      <body style={{ margin: 0, height: '100vh', overflow: 'hidden' }}>
        <MantineProvider theme={theme}>
          <Providers>{children}</Providers>
        </MantineProvider>
      </body>
    </html>
  );
}

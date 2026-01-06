'use client';

import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '@/components/ui';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath="/api/auth">
      <ToastProvider>
        {children}
      </ToastProvider>
    </SessionProvider>
  );
}

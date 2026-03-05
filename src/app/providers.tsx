'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';

export function Providers({ children }: { children: React.ReactNode }) {
  const { initialize } = useUserStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <>{children}</>;
}

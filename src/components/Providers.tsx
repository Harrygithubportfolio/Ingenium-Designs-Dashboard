'use client';

import { AuthProvider } from '@/lib/auth';
import AuthGate from '@/components/AuthGate';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>{children}</AuthGate>
    </AuthProvider>
  );
}

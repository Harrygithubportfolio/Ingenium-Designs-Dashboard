import './globals.css';
import type { Metadata } from 'next';
import Providers from '@/components/Providers';
import DashboardLayout from '@/components/DashboardLayout';

export const metadata: Metadata = {
  title: 'Life OS | Personal Dashboard',
  description: 'Your personal Life Operating System - Track, manage, and optimize every aspect of your life.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <Providers>
          <DashboardLayout>{children}</DashboardLayout>
        </Providers>
      </body>
    </html>
  );
}

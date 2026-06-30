import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FC Raffle - Football Club Community Raffle',
  description: 'Community raffle management for football club supporters',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

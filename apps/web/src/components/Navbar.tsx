'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Navbar({ user }: { user?: { firstName: string; roles?: { role: { code: string } }[] } | null }) {
  const pathname = usePathname();
  const isAdmin = user?.roles?.some((r) => r.role.code === 'SUPER_ADMIN');
  const isSeller = user?.roles?.some((r) => r.role.code === 'COMMUNITY_SELLER');
  const isFinance = user?.roles?.some((r) => r.role.code === 'FINANCE');

  const links = [
    { href: '/', label: 'Home' },
    { href: '/raffles', label: 'Raffles' },
    ...(user ? [{ href: '/dashboard', label: 'Dashboard' }] : []),
    ...(isSeller ? [{ href: '/seller', label: 'Seller' }] : []),
    ...(isFinance ? [{ href: '/finance', label: 'Finance' }] : []),
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-primary text-xl">
          FC Raffle
        </Link>
        <nav className="flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors',
                pathname === link.href ? 'text-primary' : 'text-slate-600 hover:text-primary',
              )}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <span className="text-sm text-slate-500">Hi, {user.firstName}</span>
          ) : (
            <Link href="/login" className="text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

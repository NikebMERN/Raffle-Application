'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/raffles', label: 'Raffles' },
  { href: '/admin/ticket-books', label: 'Ticket Books' },
  { href: '/admin/tickets', label: 'Tickets' },
  { href: '/admin/sales', label: 'Sales' },
  { href: '/admin/draws', label: 'Draws' },
  { href: '/admin/rewards', label: 'Rewards' },
  { href: '/admin/wallet', label: 'Wallet' },
  { href: '/admin/payments', label: 'Payments' },
  { href: '/admin/notifications', label: 'Notifications' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/audit-logs', label: 'Audit Logs' },
  { href: '/admin/settings', label: 'Settings' },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-primary-dark text-white min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-lg font-bold">Admin Panel</h2>
        <p className="text-sm text-blue-200">Raffle Management</p>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'block px-3 py-2 rounded-lg text-sm transition-colors',
              pathname === item.href
                ? 'bg-white/20 text-white font-medium'
                : 'text-blue-100 hover:bg-white/10',
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

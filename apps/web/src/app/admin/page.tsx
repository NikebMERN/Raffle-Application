'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/StatCard';
import { api } from '@/lib/utils';

export default function AdminOverview() {
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [stats, setStats] = useState<Record<string, number>>({});

  useEffect(() => {
    api<Record<string, unknown>>('/health').then(setHealth).catch(() => {});
    Promise.all([
      api<{ meta: { total: number } }>('/users?limit=1'),
      api<{ meta: { total: number } }>('/raffles?limit=1'),
      api<{ data: unknown[] }>('/sales'),
    ]).then(([users, raffles, sales]) => {
      setStats({
        users: users.meta?.total || 0,
        raffles: raffles.meta?.total || 0,
        sales: sales.data?.length || 0,
      });
    }).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Overview</h1>
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Users" value={stats.users} />
        <StatCard label="Raffles" value={stats.raffles} />
        <StatCard label="Recent Sales" value={stats.sales} />
        <StatCard label="System Status" value={String(health?.status || 'unknown')} />
      </div>
      {health && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold mb-4">System Health</h2>
          <pre className="text-sm text-slate-600">{JSON.stringify(health.checks, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

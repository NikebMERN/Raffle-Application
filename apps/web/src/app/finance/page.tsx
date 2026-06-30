'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { StatCard } from '@/components/StatCard';
import { DataTable } from '@/components/DataTable';
import { api } from '@/lib/utils';

export default function FinanceDashboard() {
  const [reconciliation, setReconciliation] = useState<Record<string, number> | null>(null);
  const [sellers, setSellers] = useState<Record<string, unknown>[]>([]);
  const [wallets, setWallets] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    api<Record<string, number>>('/reports/finance').then(setReconciliation).catch(() => {});
    api<Record<string, unknown>[]>('/reports/sellers').then(setSellers).catch(() => {});
    api<Record<string, unknown>[]>('/wallet').then(setWallets).catch(() => {});
  }, []);

  return (
    <div>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Finance Dashboard</h1>

        {reconciliation && (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Payments" value={`£${reconciliation.totalPayments?.toFixed(2)}`} />
            <StatCard label="Total Sales" value={`£${reconciliation.totalSales?.toFixed(2)}`} />
            <StatCard label="Wallet Balances" value={`£${reconciliation.totalWalletBalance?.toFixed(2)}`} />
            <StatCard label="Sale Count" value={reconciliation.saleCount || 0} />
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <h2 className="font-semibold mb-4">Seller Performance</h2>
            <DataTable
              columns={[
                { key: 'seller', label: 'Seller', render: (r) => String((r.seller as { name?: string })?.name || '') },
                { key: 'sold', label: 'Sold' },
                { key: 'revenue', label: 'Revenue', render: (r) => `£${Number(r.revenue).toFixed(2)}` },
                { key: 'performance', label: 'Performance', render: (r) => `${Number(r.performance).toFixed(1)}%` },
              ]}
              data={sellers}
              onExport={() => window.print()}
            />
          </div>
          <div>
            <h2 className="font-semibold mb-4">Wallets</h2>
            <DataTable
              columns={[
                { key: 'user', label: 'User', render: (r) => String((r.user as { email?: string })?.email || '') },
                { key: 'balance', label: 'Balance', render: (r) => `£${Number(r.balance).toFixed(2)}` },
                { key: 'currency', label: 'Currency' },
              ]}
              data={wallets}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

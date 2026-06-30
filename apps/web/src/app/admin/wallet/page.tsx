'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/DataTable';
import { api } from '@/lib/utils';

export default function AdminWalletPage() {
  const [wallets, setWallets] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    api<Record<string, unknown>[]>('/wallet').then(setWallets).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Wallet</h1>
      <DataTable
        columns={[
          { key: 'user', label: 'User', render: (r) => String((r.user as { email?: string })?.email || '') },
          { key: 'balance', label: 'Balance', render: (r) => `£${Number(r.balance).toFixed(2)}` },
          { key: 'currency', label: 'Currency' },
        ]}
        data={wallets}
      />
    </div>
  );
}

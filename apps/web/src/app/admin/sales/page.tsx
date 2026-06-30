'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/DataTable';
import { api } from '@/lib/utils';

export default function AdminSalesPage() {
  const [sales, setSales] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    api<Record<string, unknown>[]>('/sales').then(setSales).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Sales</h1>
      <DataTable
        columns={[
          { key: 'channel', label: 'Channel' },
          { key: 'amount', label: 'Amount', render: (r) => `£${Number(r.amount).toFixed(2)}` },
          { key: 'createdAt', label: 'Date', render: (r) => new Date(String(r.createdAt)).toLocaleDateString() },
        ]}
        data={sales}
        onExport={() => window.print()}
      />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/DataTable';
import { api } from '@/lib/utils';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    api<Record<string, unknown>[]>('/payments').then(setPayments).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Payments</h1>
      <DataTable
        columns={[
          { key: 'status', label: 'Status' },
          { key: 'amount', label: 'Amount', render: (r) => `£${Number(r.amount).toFixed(2)}` },
          { key: 'user', label: 'User', render: (r) => String((r.user as { email?: string })?.email || '') },
          { key: 'createdAt', label: 'Date', render: (r) => new Date(String(r.createdAt)).toLocaleDateString() },
        ]}
        data={payments}
      />
    </div>
  );
}

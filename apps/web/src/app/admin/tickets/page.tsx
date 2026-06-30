'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/DataTable';
import { api } from '@/lib/utils';

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Record<string, unknown>[]>([]);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const q = statusFilter ? `?status=${statusFilter}` : '';
    api<{ data: Record<string, unknown>[] }>(`/tickets${q}`).then((r) => setTickets(r.data)).catch(() => {});
  }, [statusFilter]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Tickets</h1>
      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 mb-4">
        <option value="">All Statuses</option>
        {['ASSIGNED', 'SOLD', 'UNSOLD', 'RETURNED', 'CANCELLED', 'LOST', 'VOIDED'].map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <DataTable
        columns={[
          { key: 'ticketNumber', label: '#' },
          { key: 'status', label: 'Status' },
          { key: 'saleChannel', label: 'Channel' },
          { key: 'price', label: 'Price', render: (r) => r.price ? `£${Number(r.price).toFixed(2)}` : '-' },
        ]}
        data={tickets}
        onExport={() => window.print()}
      />
    </div>
  );
}

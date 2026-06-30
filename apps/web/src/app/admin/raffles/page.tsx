'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/DataTable';
import { api } from '@/lib/utils';

export default function AdminRafflesPage() {
  const [raffles, setRaffles] = useState<Record<string, unknown>[]>([]);
  const [form, setForm] = useState({ title: '', description: '', ticketPrice: '5.00', status: 'DRAFT' });

  useEffect(() => {
    loadRaffles();
  }, []);

  function loadRaffles() {
    api<{ data: Record<string, unknown>[] }>('/raffles').then((r) => setRaffles(r.data)).catch(() => {});
  }

  async function createRaffle(e: React.FormEvent) {
    e.preventDefault();
    await api('/raffles', {
      method: 'POST',
      body: JSON.stringify({ ...form, ticketPrice: parseFloat(form.ticketPrice) }),
    });
    setForm({ title: '', description: '', ticketPrice: '5.00', status: 'DRAFT' });
    loadRaffles();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Raffles</h1>

      <form onSubmit={createRaffle} className="bg-white rounded-xl border p-6 mb-8 grid md:grid-cols-2 gap-4">
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border rounded-lg px-3 py-2" required />
        <input placeholder="Ticket Price" type="number" step="0.01" value={form.ticketPrice} onChange={(e) => setForm({ ...form, ticketPrice: e.target.value })} className="border rounded-lg px-3 py-2" required />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border rounded-lg px-3 py-2 md:col-span-2" />
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="border rounded-lg px-3 py-2">
          {['DRAFT', 'ACTIVE', 'CLOSED', 'DRAWN', 'ARCHIVED'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg">Create Raffle</button>
      </form>

      <DataTable
        columns={[
          { key: 'title', label: 'Title' },
          { key: 'status', label: 'Status' },
          { key: 'ticketPrice', label: 'Price', render: (r) => `£${Number(r.ticketPrice).toFixed(2)}` },
        ]}
        data={raffles}
        onExport={() => window.print()}
      />
    </div>
  );
}

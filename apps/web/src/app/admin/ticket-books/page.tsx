'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/DataTable';
import { api } from '@/lib/utils';

export default function AdminTicketBooksPage() {
  const [books, setBooks] = useState<Record<string, unknown>[]>([]);
  const [form, setForm] = useState({ raffleId: '', bookNumber: '', startTicketNumber: '', endTicketNumber: '', sellerId: '' });

  useEffect(() => {
    loadBooks();
  }, []);

  function loadBooks() {
    api<{ data: Record<string, unknown>[] }>('/ticket-books').then((r) => setBooks(r.data)).catch(() => {});
  }

  async function createBook(e: React.FormEvent) {
    e.preventDefault();
    await api('/ticket-books', {
      method: 'POST',
      body: JSON.stringify({
        raffleId: form.raffleId,
        bookNumber: form.bookNumber,
        startTicketNumber: parseInt(form.startTicketNumber),
        endTicketNumber: parseInt(form.endTicketNumber),
        sellerId: form.sellerId || undefined,
      }),
    });
    loadBooks();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Ticket Books</h1>
      <form onSubmit={createBook} className="bg-white rounded-xl border p-6 mb-8 grid md:grid-cols-3 gap-4">
        <input placeholder="Raffle ID" value={form.raffleId} onChange={(e) => setForm({ ...form, raffleId: e.target.value })} className="border rounded-lg px-3 py-2" required />
        <input placeholder="Book Number" value={form.bookNumber} onChange={(e) => setForm({ ...form, bookNumber: e.target.value })} className="border rounded-lg px-3 py-2" required />
        <input placeholder="Seller ID (optional)" value={form.sellerId} onChange={(e) => setForm({ ...form, sellerId: e.target.value })} className="border rounded-lg px-3 py-2" />
        <input placeholder="Start Ticket #" type="number" value={form.startTicketNumber} onChange={(e) => setForm({ ...form, startTicketNumber: e.target.value })} className="border rounded-lg px-3 py-2" required />
        <input placeholder="End Ticket #" type="number" value={form.endTicketNumber} onChange={(e) => setForm({ ...form, endTicketNumber: e.target.value })} className="border rounded-lg px-3 py-2" required />
        <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg">Create Book</button>
      </form>
      <DataTable
        columns={[
          { key: 'bookNumber', label: 'Book #' },
          { key: 'status', label: 'Status' },
          { key: 'startTicketNumber', label: 'Start' },
          { key: 'endTicketNumber', label: 'End' },
          { key: 'seller', label: 'Seller', render: (r) => String((r.seller as { email?: string })?.email || 'Unassigned') },
        ]}
        data={books}
      />
    </div>
  );
}

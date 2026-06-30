'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { StatCard } from '@/components/StatCard';
import { DataTable } from '@/components/DataTable';
import { api, User } from '@/lib/utils';

interface SellerStats {
  assigned: number;
  sold: number;
  unsold: number;
  returned: number;
  cancelled: number;
  lost: number;
  moneyCollected: number;
  commission: number;
  netRemittance: number;
  performance: number;
}

export default function SellerDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [books, setBooks] = useState<Record<string, unknown>[]>([]);
  const [saleForm, setSaleForm] = useState({ ticketId: '', amount: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    api<User>('/auth/me').then((u) => {
      setUser(u);
      if (u) {
        api<SellerStats>(`/sellers/${u.id}/stats`).then(setStats).catch(() => {});
        api<{ data: Record<string, unknown>[] }>(`/ticket-books?sellerId=${u.id}`).then((r) => setBooks(r.data)).catch(() => {});
      }
    });
  }, []);

  async function recordSale(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    try {
      await api('/sales/offline', {
        method: 'POST',
        body: JSON.stringify({
          ticketId: saleForm.ticketId,
          sellerId: user.id,
          amount: parseFloat(saleForm.amount),
        }),
      });
      setMessage('Sale recorded successfully');
      setSaleForm({ ticketId: '', amount: '' });
      api<SellerStats>(`/sellers/${user.id}/stats`).then(setStats);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Sale failed');
    }
  }

  return (
    <div>
      <Navbar user={user || undefined} />
      <main className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Seller Dashboard</h1>

        {stats && (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Assigned" value={stats.assigned} />
            <StatCard label="Sold" value={stats.sold} />
            <StatCard label="Unsold" value={stats.unsold} />
            <StatCard label="Performance" value={`${stats.performance.toFixed(1)}%`} />
            <StatCard label="Money Collected" value={`£${stats.moneyCollected.toFixed(2)}`} />
            <StatCard label="Commission" value={`£${stats.commission.toFixed(2)}`} />
            <StatCard label="Net Remittance" value={`£${stats.netRemittance.toFixed(2)}`} />
            <StatCard label="Returned" value={stats.returned} />
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <h2 className="font-semibold mb-4">My Ticket Books</h2>
            <DataTable
              columns={[
                { key: 'bookNumber', label: 'Book #' },
                { key: 'startTicketNumber', label: 'Start' },
                { key: 'endTicketNumber', label: 'End' },
                { key: 'status', label: 'Status' },
              ]}
              data={books}
            />
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4">Record Offline Sale</h2>
            {message && <p className="text-sm mb-4 text-green-600">{message}</p>}
            <form onSubmit={recordSale} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ticket ID</label>
                <input
                  value={saleForm.ticketId}
                  onChange={(e) => setSaleForm({ ...saleForm, ticketId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (£)</label>
                <input
                  type="number"
                  step="0.01"
                  value={saleForm.amount}
                  onChange={(e) => setSaleForm({ ...saleForm, amount: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark">
                Record Sale
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

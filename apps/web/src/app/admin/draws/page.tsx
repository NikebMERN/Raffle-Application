'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/DataTable';
import { api } from '@/lib/utils';

export default function AdminDrawsPage() {
  const [draws, setDraws] = useState<Record<string, unknown>[]>([]);
  const [form, setForm] = useState({ roundId: '', prizeId: '' });
  const [result, setResult] = useState('');

  useEffect(() => {
    api<Record<string, unknown>[]>('/draws').then(setDraws).catch(() => {});
  }, []);

  async function executeDraw(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await api<{ winner: { ticketNumber: number }; participantCount: number }>('/draws/execute', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setResult(`Winner: Ticket #${res.winner.ticketNumber} (${res.participantCount} participants)`);
      api<Record<string, unknown>[]>('/draws').then(setDraws);
    } catch (err) {
      setResult(err instanceof Error ? err.message : 'Draw failed');
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Draws</h1>

      <form onSubmit={executeDraw} className="bg-white rounded-xl border p-6 mb-8 grid md:grid-cols-3 gap-4">
        <input placeholder="Round ID" value={form.roundId} onChange={(e) => setForm({ ...form, roundId: e.target.value })} className="border rounded-lg px-3 py-2" required />
        <input placeholder="Prize ID" value={form.prizeId} onChange={(e) => setForm({ ...form, prizeId: e.target.value })} className="border rounded-lg px-3 py-2" required />
        <button type="submit" className="bg-accent text-slate-900 font-semibold px-4 py-2 rounded-lg">Execute Draw</button>
      </form>
      {result && <p className="mb-4 text-green-700 font-medium">{result}</p>}

      <DataTable
        columns={[
          { key: 'drawnAt', label: 'Date', render: (r) => new Date(String(r.drawnAt)).toLocaleString() },
          { key: 'participantCount', label: 'Participants' },
          { key: 'method', label: 'Method' },
        ]}
        data={draws}
      />
    </div>
  );
}

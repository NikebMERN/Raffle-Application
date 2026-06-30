'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { api, Raffle } from '@/lib/utils';

export default function RaffleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [tickets, setTickets] = useState<{ id: string; ticketNumber: number; status: string }[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<Raffle>(`/raffles/public/${id}`).then(setRaffle).catch(() => {});
    api<{ data: { id: string; ticketNumber: number; status: string }[] }>(
      `/tickets/public?raffleId=${id}&status=UNSOLD&limit=50`,
    ).then((res) => setTickets(res.data || [])).catch(() => {});
  }, [id]);

  async function handlePurchase() {
    if (selected.length === 0) return;
    setLoading(true);
    try {
      const res = await api<{ url: string }>('/payments/checkout', {
        method: 'POST',
        body: JSON.stringify({ ticketIds: selected }),
      });
      if (res.url) window.location.href = res.url;
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }

  if (!raffle) return <div><Navbar /><main className="p-8">Loading...</main></div>;

  return (
    <div>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">{raffle.title}</h1>
        <p className="text-slate-600 mb-6">{raffle.description}</p>
        <div className="bg-white rounded-xl border p-6 mb-8">
          <p className="text-2xl font-bold text-primary mb-4">£{Number(raffle.ticketPrice).toFixed(2)} per ticket</p>
          {raffle.rounds?.map((round) => (
            <div key={round.id} className="mb-4">
              <h3 className="font-semibold">{round.title}</h3>
              <ul className="mt-2 space-y-1">
                {round.prizes?.map((prize) => (
                  <li key={prize.id} className="text-sm text-slate-600">
                    🏆 {prize.name} — £{Number(prize.value).toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold mb-4">Select Tickets (Online)</h2>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-6">
            {tickets.map((t) => (
              <button
                key={t.id}
                onClick={() =>
                  setSelected((prev) =>
                    prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id],
                  )
                }
                className={`p-2 text-sm border rounded-lg ${
                  selected.includes(t.id) ? 'bg-primary text-white border-primary' : 'hover:border-primary'
                }`}
              >
                #{t.ticketNumber}
              </button>
            ))}
          </div>
          {selected.length > 0 && (
            <div className="flex items-center justify-between">
              <span>{selected.length} ticket(s) — £{(selected.length * Number(raffle.ticketPrice)).toFixed(2)}</span>
              <button
                onClick={handlePurchase}
                disabled={loading}
                className="bg-accent text-slate-900 font-semibold px-6 py-2 rounded-lg hover:bg-amber-400 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Buy Now'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

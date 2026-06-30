import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { api, Raffle } from '@/lib/utils';

async function getRaffles() {
  try {
    const res = await api<{ data: Raffle[] }>('/raffles/public');
    return res.data;
  } catch {
    return [];
  }
}

export default async function RafflesPage() {
  const raffles = await getRaffles();

  return (
    <div>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Active Raffles</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {raffles.map((raffle) => (
            <Link
              key={raffle.id}
              href={`/raffles/${raffle.id}`}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="font-semibold text-xl mb-2">{raffle.title}</h2>
              <p className="text-slate-500 text-sm mb-4">{raffle.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-primary font-bold text-lg">£{Number(raffle.ticketPrice).toFixed(2)} per ticket</span>
                <span className="text-sm text-primary">View &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

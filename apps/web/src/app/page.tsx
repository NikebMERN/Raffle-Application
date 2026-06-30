import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { api, Raffle } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getRaffles() {
  try {
    const res = await api<{ data: Raffle[] }>('/raffles/public');
    return res.data;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const raffles = await getRaffles();

  return (
    <div>
      <Navbar />
      <main>
        <section className="bg-gradient-to-br from-primary to-primary-dark text-white py-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-4">Football Club Community Raffle</h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Support your club and win amazing prizes. Buy tickets online or from community sellers.
            </p>
            <Link
              href="/raffles"
              className="inline-block bg-accent text-slate-900 font-semibold px-8 py-3 rounded-lg hover:bg-amber-400 transition-colors"
            >
              View Active Raffles
            </Link>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold mb-8">Active Raffles</h2>
          {raffles.length === 0 ? (
            <p className="text-slate-500">No active raffles at the moment. Check back soon!</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {raffles.map((raffle) => (
                <Link
                  key={raffle.id}
                  href={`/raffles/${raffle.id}`}
                  className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <h3 className="font-semibold text-lg mb-2">{raffle.title}</h3>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-2">{raffle.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-primary font-bold">£{Number(raffle.ticketPrice).toFixed(2)}</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{raffle.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="bg-slate-100 py-16">
          <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">Online</div>
              <p className="text-slate-600">Buy tickets securely with card payment</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">Community</div>
              <p className="text-slate-600">Purchase from local community sellers</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">Fair Draw</div>
              <p className="text-slate-600">Cryptographically secure winner selection</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

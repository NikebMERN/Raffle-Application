import { Navbar } from '@/components/Navbar';
import { StatCard } from '@/components/StatCard';
import { api, User } from '@/lib/utils';

async function getUser() {
  try {
    return await api<User>('/auth/me');
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    return (
      <div>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-12 text-center">
          <p>Please <a href="/login" className="text-primary">sign in</a> to view your dashboard.</p>
        </main>
      </div>
    );
  }

  let tickets: { data: unknown[] } = { data: [] };
  let notifications: unknown[] = [];

  try {
    tickets = await api('/tickets?buyerId=' + user.id);
    notifications = await api('/notifications/my');
  } catch {
    // not logged in or no data
  }

  return (
    <div>
      <Navbar user={user} />
      <main className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Welcome, {user.firstName}</h1>
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatCard label="My Tickets" value={tickets.data?.length || 0} />
          <StatCard
            label="Wallet Balance"
            value={`£${Number(user.wallet?.balance || 0).toFixed(2)}`}
            subtext={user.wallet?.currency || 'GBP'}
          />
          <StatCard label="Notifications" value={Array.isArray(notifications) ? notifications.length : 0} />
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold mb-4">My Tickets</h2>
          {tickets.data?.length === 0 ? (
            <p className="text-slate-500">No tickets yet. <a href="/raffles" className="text-primary">Browse raffles</a></p>
          ) : (
            <div className="space-y-2">
              {(tickets.data as { ticketNumber: number; status: string; raffle: { title: string } }[]).map((t, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-slate-100">
                  <span>#{t.ticketNumber} — {t.raffle?.title}</span>
                  <span className="text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded">{t.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

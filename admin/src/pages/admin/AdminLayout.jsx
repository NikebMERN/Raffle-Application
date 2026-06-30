import { NavLink, Outlet } from 'react-router-dom';

const I = {
  dashboard: 'M3 12l9-9 9 9M5 10v10h14V10',
  raffles: 'M3 7h18M3 12h18M3 17h18',
  draws: 'M12 2l2.4 7.4H22l-6 4.4 2.3 7.2L12 16.8 5.7 21l2.3-7.2-6-4.4h7.6z',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9',
  rewards: 'M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z',
  reports: 'M3 3v18h18M7 14l3-3 3 3 5-5',
  audit: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15H4a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 6 9.4a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 12 4.6V4a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 2.82 1.17l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9H20a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  account: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
};

function Icon({ d }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d={d} />
    </svg>
  );
}

const links = [
  { to: '/admin', label: 'Dashboard', icon: I.dashboard, end: true },
  { to: '/admin/raffles', label: 'Raffles', icon: I.raffles },
  { to: '/admin/draws', label: 'Draws', icon: I.draws },
  { to: '/admin/users', label: 'Users', icon: I.users },
  { to: '/admin/rewards', label: 'Rewards', icon: I.rewards },
  { to: '/admin/reports', label: 'Reports', icon: I.reports },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: I.audit },
  { to: '/admin/settings', label: 'Settings', icon: I.settings },
  { to: '/admin/account', label: 'Account', icon: I.account },
];

export default function AdminLayout() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
      <aside className="md:sticky md:top-24 self-start">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3 px-3">Management</h2>
        <nav className="flex md:flex-col gap-1 overflow-x-auto pb-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
            >
              <Icon d={l.icon} />
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <section className="min-w-0">
        <Outlet />
      </section>
    </div>
  );
}

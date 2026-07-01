import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import Button from './Button';

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

const LINKS = [
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

function Icon({ d }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d={d} />
    </svg>
  );
}

function SidebarContent({ clubName, user, logout, onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <Link to="/admin" onClick={onNavigate} className="flex items-center gap-2.5 px-5 h-16 border-b border-slate-200 shrink-0">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white font-display font-bold shadow-sm shadow-primary/30">
          {clubName?.[0] || 'F'}
        </span>
        <span className="font-display font-bold tracking-tight truncate">{clubName}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider bg-primary-50 text-primary-700 rounded px-1.5 py-0.5">Admin</span>
      </Link>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive ? 'bg-primary text-white shadow-sm shadow-primary/30' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            <Icon d={l.icon} />
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-3 shrink-0">
        {user && (
          <Link to="/admin/account" onClick={onNavigate} className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-100">
            {user.photoURL
              ? <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
              : <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-50 text-primary-700 text-xs font-bold">{(user.displayName || user.email || '?')[0]?.toUpperCase()}</span>}
            <span className="min-w-0 leading-tight">
              <span className="block text-sm font-medium truncate">{user.displayName || user.email}</span>
              <span className="block text-xs text-slate-400">{user.role}</span>
            </span>
          </Link>
        )}
        <Button variant="outline" size="sm" className="w-full mt-2" onClick={logout}>Sign out</Button>
      </div>
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { clubName } = useConfig();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col bg-white border-r border-slate-200 z-30">
        <SidebarContent clubName={clubName} user={user} logout={logout} />
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-white border-b border-slate-200 h-14 px-4">
        <Link to="/admin" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white font-display font-bold">{clubName?.[0] || 'F'}</span>
          <span className="font-display font-bold text-sm">{clubName} <span className="text-slate-400 font-normal">Admin</span></span>
        </Link>
        <button
          type="button"
          aria-label="Toggle menu"
          className="grid h-10 w-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6 6 18" /> : <><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></>}
          </svg>
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/40 z-40" onClick={close} />
          <aside className="md:hidden fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-50">
            <SidebarContent clubName={clubName} user={user} logout={logout} onNavigate={close} />
          </aside>
        </>
      )}

      {/* Content */}
      <div className="md:pl-64">
        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

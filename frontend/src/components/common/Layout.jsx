import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import Button from './Button';
import Footer from './Footer';
import NotificationCenter from './NotificationCenter';

function NavItem({ to, children, onClick, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive ? 'text-primary bg-primary-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { clubName } = useConfig();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0" onClick={close}>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white font-display font-bold shadow-sm shadow-primary/30">
              {clubName?.[0] || 'F'}
            </span>
            <span className="font-display font-bold text-lg tracking-tight">{clubName}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavItem to="/" end>Home</NavItem>
            <NavItem to="/raffles">Raffles</NavItem>
            {user && <NavItem to="/dashboard">Dashboard</NavItem>}
            {user && <NavItem to="/my-tickets">My Tickets</NavItem>}
            {user && <NavItem to="/wallet">Wallet</NavItem>}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <NotificationCenter />
                <Link to="/dashboard" className="text-sm text-slate-500 hover:text-primary">Hi, {user.firstName || user.displayName || 'there'}</Link>
                <Button variant="outline" size="sm" onClick={async () => { await logout(); navigate('/'); }}>
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/login"><Button size="sm">Sign in</Button></Link>
            )}
          </div>

          <div className="md:hidden flex items-center gap-1">
            {user && <NotificationCenter />}
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></>}
            </svg>
          </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-1">
            <NavItem to="/" end onClick={close}>Home</NavItem>
            <NavItem to="/raffles" onClick={close}>Raffles</NavItem>
            {user && <NavItem to="/dashboard" onClick={close}>Dashboard</NavItem>}
            {user && <NavItem to="/my-tickets" onClick={close}>My Tickets</NavItem>}
            {user && <NavItem to="/wallet" onClick={close}>Wallet</NavItem>}
            <div className="pt-2 mt-2 border-t border-slate-100">
              {user ? (
                <Button variant="outline" size="sm" className="w-full" onClick={async () => { close(); await logout(); navigate('/'); }}>
                  Logout
                </Button>
              ) : (
                <Link to="/login" onClick={close}><Button size="sm" className="w-full">Sign in</Button></Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

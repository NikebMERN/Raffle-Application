import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import Button from './Button';

export default function Layout() {
  const { user, logout } = useAuth();
  const { clubName } = useConfig();

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/admin" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white font-display font-bold shadow-sm shadow-primary/30">
              {clubName?.[0] || 'F'}
            </span>
            <span className="font-display font-bold tracking-tight">{clubName}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-primary-50 text-primary-700 rounded px-2 py-0.5">
              Admin
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {user && (
              <Link to="/admin/account" className="flex items-center gap-2 text-sm rounded-lg px-2 py-1 hover:bg-slate-100">
                {user.photoURL
                  ? <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" />
                  : (
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-50 text-primary-700 text-xs font-bold">
                      {(user.displayName || user.email || '?')[0]?.toUpperCase()}
                    </span>
                  )}
                <span className="hidden sm:block text-right leading-tight">
                  <span className="block font-medium">{user.displayName || user.email}</span>
                  <span className="block text-xs text-slate-400">{user.role}</span>
                </span>
              </Link>
            )}
            <Button variant="outline" size="sm" onClick={logout}>Sign out</Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

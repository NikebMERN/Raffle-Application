import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-bold text-primary text-xl">SF Raffle</Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/raffles">Raffles</Link>
            {user && <Link to="/my-tickets">My Tickets</Link>}
            {user && <Link to="/wallet">Wallet</Link>}
            {isAdmin && <Link to="/admin">Admin</Link>}
            {user ? (
              <>
                <span className="text-slate-500">Hi, {user.firstName}</span>
                <Button variant="outline" onClick={async () => { await logout(); navigate('/'); }}>Logout</Button>
              </>
            ) : (
              <Link to="/login"><Button>Login</Button></Link>
            )}
          </nav>
        </div>
      </header>
      <main><Outlet /></main>
    </div>
  );
}

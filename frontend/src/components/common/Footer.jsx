import { Link } from 'react-router-dom';
import { useConfig } from '../../context/ConfigContext';

export default function Footer() {
  const { clubName } = useConfig();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white font-display font-bold">
              {clubName?.[0] || 'F'}
            </span>
            <span className="font-display font-bold text-lg">{clubName}</span>
          </div>
          <p className="mt-3 text-sm text-slate-500 max-w-xs">
            A transparent community raffle — fair, cryptographically secure draws supporting the club.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Play</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><Link to="/raffles" className="hover:text-primary">Active raffles</Link></li>
            <li><Link to="/my-tickets" className="hover:text-primary">My tickets</Link></li>
            <li><Link to="/wallet" className="hover:text-primary">Wallet</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">How it works</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>Buy tickets for the open round</li>
            <li>Draw runs when sold out or at deadline</li>
            <li>Winners selected by secure shuffle</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Trust</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>SHA-256 participant audit hash</li>
            <li>Fixed published prize split</li>
            <li>One draw per round, locked</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-5 text-xs text-slate-400 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <span>© {year} {clubName}. All rights reserved.</span>
          <span>Please play responsibly. 18+.</span>
        </div>
      </div>
    </footer>
  );
}

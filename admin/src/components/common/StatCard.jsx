import Card from './Card';

const TONES = {
  primary: 'bg-primary-50 text-primary-700',
  violet: 'bg-violet-50 text-violet-600',
  amber: 'bg-amber-50 text-amber-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  sky: 'bg-sky-50 text-sky-600',
};

export default function StatCard({ label, value, tone = 'primary', hint = null, icon = null }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${TONES[tone] || TONES.primary}`}>
          {label}
        </span>
        {icon && <span className="text-slate-300">{icon}</span>}
      </div>
      <p className="text-3xl font-bold font-display tracking-tight">{value}</p>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </Card>
  );
}

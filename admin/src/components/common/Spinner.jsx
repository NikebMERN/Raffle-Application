export default function Spinner({ className = '', label = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 p-8 ${className}`}>
      <div className="w-8 h-8 rounded-full border-[3px] border-primary/25 border-t-primary animate-spin" />
      {label && <p className="text-sm text-slate-400">{label}</p>}
    </div>
  );
}

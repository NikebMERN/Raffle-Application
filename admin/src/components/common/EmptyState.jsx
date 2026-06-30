export default function EmptyState({ title, description = '', action = null, icon = null, className = '' }) {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      {icon && <div className="mx-auto mb-3 flex justify-center text-slate-300">{icon}</div>}
      <p className="font-semibold text-slate-700">{title}</p>
      {description && <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

const VARIANTS = {
  primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm shadow-primary/30',
  accent: 'bg-accent text-slate-900 hover:bg-amber-400 shadow-sm shadow-accent/30',
  secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-600/20',
  outline: 'border border-slate-300 text-slate-700 hover:border-primary hover:text-primary hover:bg-primary-50',
  ghost: 'text-slate-600 hover:bg-slate-100',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2
        active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none
        ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md} ${className}`}
      {...props}
    >
      {loading && <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />}
      {children}
    </button>
  );
}

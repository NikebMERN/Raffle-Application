export default function Card({ children, className = '', hover = false, as: Tag = 'div', ...props }) {
  return (
    <Tag
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-card p-6
        ${hover ? 'transition duration-200 hover:shadow-card-hover hover:-translate-y-0.5' : ''} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}

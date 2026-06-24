export default function Badge({ children, className = '', ...props }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-cutai-border bg-cutai-surface px-2.5 py-0.5 text-xs font-medium text-cutai-text ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export default function LoadingSpinner({ message }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-cutai-muted">
      <span className="relative flex h-10 w-10">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cutai-accent/40 opacity-75" />
        <span className="relative inline-flex h-10 w-10 rounded-full bg-cutai-accent/60" />
      </span>
      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}

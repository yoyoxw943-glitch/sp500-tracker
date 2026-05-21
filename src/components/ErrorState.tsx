interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({ message = 'Something went wrong. Please try again.', onRetry }: ErrorStateProps) {
  return (
    <div className="card text-center py-10" role="alert">
      <p className="text-slate-400 text-min mb-5">{message}</p>
      {onRetry && <button onClick={onRetry} className="btn-primary">Retry</button>}
    </div>
  );
}

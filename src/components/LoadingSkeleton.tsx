export function CardSkeleton() {
  return (
    <div className="card space-y-3" aria-hidden="true">
      <div className="skeleton h-7 w-3/4 rounded-lg" />
      <div className="skeleton h-6 w-1/2 rounded-lg" />
      <div className="skeleton h-40 w-full rounded-xl" />
    </div>
  );
}

export function LineSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton h-6 rounded-lg" style={{ width: `${70 + Math.random() * 30}%` }} />
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="card" aria-hidden="true">
      <div className="skeleton h-6 w-1/3 rounded-lg mb-3" />
      <div className="skeleton h-52 w-full rounded-xl" />
    </div>
  );
}

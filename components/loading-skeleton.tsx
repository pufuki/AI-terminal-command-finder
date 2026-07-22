export function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card p-4"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg animate-shimmer" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-2/3 rounded animate-shimmer" />
              <div className="h-2.5 w-1/4 rounded animate-shimmer" />
            </div>
          </div>
          <div className="mt-3 h-10 rounded-lg animate-shimmer" />
          <div className="mt-3 space-y-1.5">
            <div className="h-2.5 w-full rounded animate-shimmer" />
            <div className="h-2.5 w-3/4 rounded animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

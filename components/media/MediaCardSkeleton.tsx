export function MediaCardSkeleton() {
  return (
    <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-800" />
      <div className="px-2.5 pt-2 pb-2.5 space-y-1.5">
        <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
        <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
        <div className="h-2.5 bg-slate-100 dark:bg-slate-800/60 rounded w-1/2" />
      </div>
    </div>
  );
}

export function MediaGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <MediaCardSkeleton key={i} />
      ))}
    </div>
  );
}

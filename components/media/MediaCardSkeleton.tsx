export function MediaCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-video bg-slate-200 dark:bg-slate-700" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-md w-1/2" />
        <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded-md w-3/4" />
        <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded-md w-1/2" />
        <div className="h-2.5 bg-slate-100 dark:bg-slate-700/60 rounded-md w-1/3 mt-1" />
      </div>
    </div>
  );
}

export function MediaGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MediaCardSkeleton key={i} />
      ))}
    </div>
  );
}

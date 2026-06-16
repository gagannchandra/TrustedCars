/** Lightweight shimmer skeletons used while data loads. */

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/80 ${className}`}
      aria-hidden="true"
    />
  );
}

export function CarCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[10px] border border-slate-200 bg-white">
      <Shimmer className="aspect-4-3 rounded-none" />
      <div className="space-y-2.5 p-3.5">
        <Shimmer className="h-4 w-3/4" />
        <Shimmer className="h-3 w-1/2" />
        <div className="flex gap-2 pt-1">
          <Shimmer className="h-3 w-10" />
          <Shimmer className="h-3 w-10" />
          <Shimmer className="h-3 w-10" />
        </div>
        <div className="flex justify-between border-t border-slate-100 pt-3">
          <Shimmer className="h-5 w-16" />
          <Shimmer className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

export function CarGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CarCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <Shimmer className="h-4 w-40" />
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Shimmer className="aspect-4-3 w-full rounded-[10px]" />
          <Shimmer className="h-32 w-full rounded-[10px]" />
          <Shimmer className="h-64 w-full rounded-[10px]" />
        </div>
        <div className="space-y-4">
          <Shimmer className="h-40 w-full rounded-[10px]" />
          <Shimmer className="h-40 w-full rounded-[10px]" />
        </div>
      </div>
    </div>
  );
}

export function InlineSpinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
      {label && <span>{label}</span>}
    </div>
  );
}

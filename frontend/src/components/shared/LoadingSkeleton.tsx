import { Skeleton } from "@/components/ui/skeleton";

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-white/5 bg-zinc-950/40 p-6 rounded-xl space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <Skeleton className="h-16 w-full" />
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-3 border-b border-white/5">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className={`h-4 ${j === 0 ? "w-32" : "w-16"}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex h-[500px] border border-white/10 rounded-xl overflow-hidden bg-zinc-950/20">
      {/* Sidebar Skeleton */}
      <div className="w-80 border-r border-white/10 p-4 space-y-4 hidden md:block shrink-0">
        <Skeleton className="h-9 w-full" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Chat Window Skeleton */}
      <div className="flex-1 flex flex-col p-4 justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
        <div className="flex-1 py-4 space-y-4 overflow-y-auto">
          <div className="flex gap-3 justify-start">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <Skeleton className="h-16 w-1/2 rounded-xl" />
          </div>
          <div className="flex gap-3 justify-end">
            <Skeleton className="h-12 w-1/3 rounded-xl" />
          </div>
          <div className="flex gap-3 justify-start">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <Skeleton className="h-20 w-3/5 rounded-xl" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-10 shrink-0" />
        </div>
      </div>
    </div>
  );
}

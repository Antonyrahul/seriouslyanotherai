import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      {/* Compact Hero Section Skeleton */}
      <div className="mb-6">
        <div>
          <Skeleton className="h-7 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-28 rounded" />
          </div>
        </div>
      </div>

      {/* Tools Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="group p-3 rounded-lg bg-muted/50">
            <div className="flex items-start gap-3">
              <Skeleton className="w-14 h-14 rounded-md flex-shrink-0" />
              <div className="flex-1 min-w-0 pr-1">
                <Skeleton className="h-4 w-2/3 mb-2 rounded" />
                <Skeleton className="h-3 w-full rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { ToolLayout } from "@/components/layout/tool-layout";

export default function Loading() {
  return (
    <ToolLayout>
      <main className="max-w-xl mx-auto py-4 md:px-4">
        {/* Header with logo and button */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            {/* Logo skeleton */}
            <div className="w-20 h-20 rounded-md bg-gray-100 opacity-80 animate-pulse" />
          </div>
          {/* Button skeleton */}
          <div className="h-8 w-18 rounded-full bg-gray-100 opacity-80" />
        </div>
        {/* Title and description skeleton */}
        <div className="mb-4">
          <div className="h-7 w-2/3 bg-gray-100 opacity-80 rounded mb-2 animate-pulse" />
          <div className="h-4 w-full bg-gray-100 opacity-70 rounded mb-1" />
          <div className="h-4 w-5/6 bg-gray-100 opacity-60 rounded mb-1" />
          <div className="h-4 w-4/6 bg-gray-100 opacity-50 rounded" />
        </div>
        {/* Promo Offer skeleton */}
        <div className="mb-4">
          <div className="h-8 w-40 bg-gray-100 opacity-70 rounded" />
        </div>
        {/* App Screenshot skeleton */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-md">
            <div className="h-48 w-full bg-gray-100 opacity-80 animate-pulse" />
          </div>
        </div>
        <div className="mt-16 space-y-6">
          {/* Section header */}
          <div className="flex items-center gap-4">
            <div className="h-6 w-1/3 bg-gray-100 opacity-80 rounded animate-pulse" />
            <div className="flex-1 border-b border-gray-200" />
          </div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
              >
                {/* Logo skeleton */}
                <div className="w-14 h-14 rounded-md bg-gray-100 opacity-60 animate-pulse flex-shrink-0" />
                {/* Content skeleton */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="h-4 w-2/3 bg-gray-100 opacity-80 rounded mb-2 animate-pulse" />
                  <div className="h-3 w-full bg-gray-100 opacity-60 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </ToolLayout>
  );
}

"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { ToolsGrid } from "@/components/tools/tools-grid";
import { Tool } from "@/lib/types";
import { useRouter } from "next/navigation";
import { getToolsPaginated } from "@/app/actions/tools";
import { combineToolsWithSponsorship, type SponsoredTool } from "@/lib/utils";

// Interfaces moved to lib/utils.ts for reusability

interface ClientHomePageProps {
  initialTools: Tool[];
  sponsoredTools: SponsoredTool[];
  hasMore: boolean;
  initialPageSize: number;
}

export function ClientHomePage({
  initialTools,
  sponsoredTools,
  hasMore: initialHasMore,
  initialPageSize,
}: ClientHomePageProps) {
  const router = useRouter();
  const [tools, setTools] = useState<Tool[]>(initialTools);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  // Combine sponsored and regular tools using centralized utility
  const allTools = combineToolsWithSponsorship(sponsoredTools, tools);

  const handleToolClick = (tool: Tool) => {
    router.push(`/${tool.slug}`);
  };

  const loadMoreTools = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const nextPage = currentPage + 1;
      const result = await getToolsPaginated(nextPage, initialPageSize);

      // Add new subscription tools (SQL excludes tools with active ads)
      setTools((prevTools) => [...prevTools, ...result.tools]);
      setCurrentPage(nextPage);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error("Error loading more tools:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout showHero={true}>
      <div className="space-y-4">
        <ToolsGrid
          tools={allTools}
          onToolClick={handleToolClick}
          isHomePage={true}
        />

        {/* Load More Section */}
        {hasMore && (
          <button
            onClick={loadMoreTools}
            disabled={loading}
            className="w-full py-2 bg-muted rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        )}
      </div>
    </AppLayout>
  );
}

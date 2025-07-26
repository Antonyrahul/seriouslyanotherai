"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ToolsGrid } from "@/components/tools/tools-grid";
import { Tool } from "@/lib/types";
import { PAGINATION_CONFIG, SITE_CONFIG } from "@/lib/constants/config";
import { getToolsByCategoryPaginated } from "@/app/actions/tools";
import Link from "next/link";
import { Plus } from "lucide-react";
import { combineToolsWithSponsorship, type SponsoredTool } from "@/lib/utils";

// Interfaces moved to lib/utils.ts for reusability

interface CategoryPageClientProps {
  initialTools: Tool[];
  sponsoredTools: SponsoredTool[];
  hasMore: boolean;
  activeCategory: string;
  categoryHref: string;
}

export function CategoryPageClient({
  initialTools,
  sponsoredTools,
  hasMore: initialHasMore,
  activeCategory,
  categoryHref,
}: CategoryPageClientProps) {
  const router = useRouter();
  const [tools, setTools] = useState<Tool[]>(initialTools);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  // Find category client-side to avoid serialization issues
  const category = SITE_CONFIG.navigation.categories.find(
    (cat) => cat.href === categoryHref
  );

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
      const result = await getToolsByCategoryPaginated(
        activeCategory,
        nextPage,
        PAGINATION_CONFIG.CATEGORY_PAGE_SIZE
      );

      // Add new tools (filtering is handled at SQL level)
      setTools((prevTools) => [...prevTools, ...result.tools]);
      setCurrentPage(nextPage);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error("Error loading more tools:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!category) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Compact Hero Section */}
      <div className="mb-6">
        <div>
          <h1 className="text-lg mb-1 text-foreground">{category.name}</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Discover the best tools in {category.name}
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/submit"
              className="border border-border bg-background px-3 py-1.5 rounded-md text-sm font-medium hover:bg-muted/50 transition-colors inline-flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Submit tool
            </Link>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <ToolsGrid tools={allTools} onToolClick={handleToolClick} />

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
  );
}

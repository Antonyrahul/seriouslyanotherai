"use client";

import { Tool } from "@/lib/types";
import { ToolCard } from "./tool-card";

interface ToolWithSponsorship extends Tool {
  isSponsored: boolean;
}

interface ToolsGridProps {
  tools: ToolWithSponsorship[];
  loading?: boolean;
  onToolClick?: (tool: Tool) => void;
  isHomePage?: boolean;
}

export function ToolsGrid({
  tools,
  loading,
  onToolClick,
  isHomePage = false,
}: ToolsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-[140px] bg-muted/30 animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (tools.length === 0) {
    if (isHomePage) {
      return null;
    }

    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-base">
          No tools found in this category
        </p>
        <p className="text-muted-foreground text-sm mt-1">
          Try selecting a different category or search for specific tools
        </p>
      </div>
    );
  }

  // Find the first non-sponsored tool for "New" badge
  const firstNonSponsoredTool = isHomePage
    ? tools.find((tool) => !tool.isSponsored)
    : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {tools.map((tool) => (
        <ToolCard
          key={tool.id}
          tool={tool}
          isSponsored={tool.isSponsored}
          isNewest={tool === firstNonSponsoredTool}
          hasPromo={!!tool.promoCode}
          onClick={() => onToolClick?.(tool)}
        />
      ))}
    </div>
  );
}

/* eslint-disable @next/next/no-img-element */
"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tool } from "@/lib/types";

interface MyToolsListProps {
  tools: Tool[];
  onSelect: (tool: Tool) => void;
  selectedToolId?: string;
  error?: boolean;
}

export function MyToolsList({
  tools,
  onSelect,
  selectedToolId,
  error,
}: MyToolsListProps) {
  if (tools.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 text-sm">
          No previous ads found. Create a new tool for your ad.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Select Tool</h3>
      <div
        className={cn(
          "space-y-2",
          error && "ring-2 ring-red-300 rounded-lg p-2"
        )}
      >
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onSelect(tool)}
            className={cn(
              "w-full p-3 rounded-lg border text-left transition-colors",
              selectedToolId === tool.id
                ? "border-black bg-gray-50"
                : "border-gray-200 hover:border-gray-300",
              error && !selectedToolId && "border-red-300"
            )}
          >
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="w-8 h-8 rounded border overflow-hidden flex-shrink-0">
                <img
                  src={tool.logoUrl || "/placeholder-logo.png"}
                  alt={tool.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder-logo.png";
                  }}
                />
              </div>

              {/* Tool info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{tool.name}</div>
                <div className="text-xs text-gray-600 truncate">
                  {new URL(tool.url).hostname}
                </div>
              </div>

              {/* Selection indicator */}
              {selectedToolId === tool.id && (
                <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

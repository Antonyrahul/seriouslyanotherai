"use client";

import { cn } from "@/lib/utils";

type ToolSource = "boost-tool" | "new-ad";

interface ToolSourceSelectorProps {
  value: ToolSource;
  onChange: (value: ToolSource) => void;
  subscriptionToolsCount: number;
}

export function ToolSourceSelector({
  value,
  onChange,
  subscriptionToolsCount,
}: ToolSourceSelectorProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Advertisement Source</h3>
      <div className="grid grid-cols-2 gap-2">
        {/* Boost Existing Tool */}
        <button
          onClick={() => onChange("boost-tool")}
          disabled={subscriptionToolsCount === 0}
          className={cn(
            "p-2 rounded-lg border text-left transition-colors",
            value === "boost-tool"
              ? "border-black bg-gray-50"
              : "border-gray-200 hover:border-gray-300",
            subscriptionToolsCount === 0 && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="font-medium text-xs">Boost Existing Tool</div>
          <div className="text-xs text-gray-600 mt-0.5">
            {subscriptionToolsCount} tool
            {subscriptionToolsCount !== 1 ? "s" : ""} to boost
          </div>
        </button>

        {/* Create New Ad */}
        <button
          onClick={() => onChange("new-ad")}
          className={cn(
            "p-2 rounded-lg border text-left transition-colors",
            value === "new-ad"
              ? "border-black bg-gray-50"
              : "border-gray-200 hover:border-gray-300"
          )}
        >
          <div className="font-medium text-xs">Create New Ad</div>
          <div className="text-xs text-gray-600 mt-0.5">
            Create fresh tool for advertising
          </div>
        </button>
      </div>
    </div>
  );
}

"use client";

import { getAdvertisementDailyRate } from "@/lib/constants/config";
import { cn } from "@/lib/utils";

interface PlacementSelectorProps {
  value: "all" | "homepage";
  onChange: (value: "all" | "homepage") => void;
}

export function PlacementSelector({ value, onChange }: PlacementSelectorProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Grid Sponsored Placement</h3>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onChange("all")}
          className={cn(
            "p-2 rounded-lg border text-left transition-colors",
            value === "all"
              ? "border-black bg-gray-50"
              : "border-gray-200 hover:border-gray-300"
          )}
        >
          <div className="font-medium text-xs">All Pages</div>
          <div className="text-xs text-gray-600 mt-0.5">
            ${getAdvertisementDailyRate("all")}/day
          </div>
        </button>

        <button
          onClick={() => onChange("homepage")}
          className={cn(
            "p-2 rounded-lg border text-left transition-colors",
            value === "homepage"
              ? "border-black bg-gray-50"
              : "border-gray-200 hover:border-gray-300"
          )}
        >
          <div className="font-medium text-xs">Homepage Only</div>
          <div className="text-xs text-gray-600 mt-0.5">
            ${getAdvertisementDailyRate("homepage")}/day
          </div>
        </button>
      </div>
    </div>
  );
}

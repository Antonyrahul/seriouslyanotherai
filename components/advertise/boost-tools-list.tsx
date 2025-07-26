"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tool } from "@/lib/types";
import Image from "next/image";

interface BoostToolsListProps {
  tools: Tool[];
  onSelect: (tool: Tool) => void;
  selectedToolId?: string;
  error?: boolean;
}

export function BoostToolsList({
  tools,
  onSelect,
  selectedToolId,
  error,
}: BoostToolsListProps) {
  if (tools.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 text-sm">
          No subscription tools found. Submit tools first via normal submission.
        </div>
      </div>
    );
  }

  const getStatusBadge = (tool: Tool) => {
    if (tool.featured) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-normal bg-green-50 text-green-700 border border-green-200">
          Live
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-normal bg-gray-50 text-gray-600 border border-gray-200">
          Hidden
        </span>
      );
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Select Tool to Boost</h3>
      <div className="text-xs text-gray-500 mb-3">
        This will create an advertisement copy of your subscription tool
      </div>
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
              "w-full rounded-lg transition-colors duration-200 relative",
              selectedToolId === tool.id
                ? "bg-muted ring-2 ring-black"
                : "bg-muted/50 hover:bg-muted",
              error && !selectedToolId && "ring-2 ring-red-300"
            )}
          >
            <div className="flex items-start gap-3 p-3">
              {/* Logo - même style que tool-card et profile-content */}
              <div className="relative">
                {tool.logoUrl ? (
                  <div className="w-14 h-14 rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={tool.logoUrl}
                      alt={tool.name}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-md bg-gray-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-white">
                      {tool.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Contenu - même style que profile-content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1 text-left">
                  {tool.name}
                </h3>
                <p className="text-xs text-gray-600 line-clamp-2 leading-tight text-left">
                  {tool.description}
                </p>
              </div>

              {/* Status badge + selection indicator */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {getStatusBadge(tool)}
                {selectedToolId === tool.id && (
                  <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

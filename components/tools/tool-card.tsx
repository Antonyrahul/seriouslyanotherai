"use client";

import { Tool } from "@/lib/types";
import Image from "next/image";

interface ToolCardProps {
  tool: Tool;
  onClick?: () => void;
  isSponsored?: boolean;
  isNewest?: boolean;
  hasPromo?: boolean;
}

export function ToolCard({
  tool,
  onClick,
  isSponsored = false,
  isNewest = false,
  hasPromo = false,
}: ToolCardProps) {
  return (
    <div
      className="group cursor-pointer p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-200 relative"
      onClick={onClick}
    >
      {/* Badges container */}
      <div className="absolute -top-2 right-3 z-10 flex gap-1">
        {/* New badge */}
        {isNewest && (
          <span className="bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded font-medium flex items-center justify-center">
            New
          </span>
        )}

        {/* Deal badge */}
        {hasPromo && (
          <span className="bg-green-200 text-green-600 text-xs px-1.5 py-0.5 rounded font-medium flex items-center justify-center">
            Deal
          </span>
        )}

        {/* Sponsored badge */}
        {isSponsored && (
          <span className="bg-gray-50 text-gray-600 text-xs px-1.5 py-0.5 rounded font-normal border border-gray-200 flex items-center justify-center">
            Ad
          </span>
        )}
      </div>

      <div className="flex items-start gap-3">
        {/* Logo circulaire */}
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
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-gray-600">
              {tool.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0 pr-1">
          {/* Header avec nom seulement */}
          <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">
            {tool.name}
          </h3>

          {/* Description */}
          <p className="text-xs text-gray-600 line-clamp-2 leading-tight">
            {tool.description}
          </p>
        </div>
      </div>
    </div>
  );
}

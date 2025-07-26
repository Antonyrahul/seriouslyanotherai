"use client";

import { Tool } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";

interface OtherToolsCategoryProps {
  tools: Tool[];
  category: string | null;
  sectionTitle?: string;
}

export function OtherToolsCategory({
  tools,
  category,
  sectionTitle,
}: OtherToolsCategoryProps) {
  // Déterminer le titre à afficher
  const displayTitle =
    sectionTitle || (category ? `Other tools in ${category}` : "Other tools");

  // Si aucun tool, afficher un message clean
  if (tools.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold whitespace-nowrap">
            {displayTitle}
          </h2>
          <div className="flex-1 border-b border-gray-200" />
        </div>
        <p className="text-sm text-muted-foreground text-center py-8">
          No other tools available at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold whitespace-nowrap">
          {displayTitle}
        </h2>
        <div className="flex-1 border-b border-gray-200" />
      </div>

      <div className="space-y-4">
        {tools.map((tool) => (
          <Link key={tool.id} href={`/${tool.slug}`} className="block group">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-200">
              {/* Logo identique à tool-card */}
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

              {/* Contenu identique à tool-card */}
              <div className="flex-1 min-w-0 pr-1">
                <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">
                  {tool.name}
                </h3>
                <p className="text-xs text-gray-600 line-clamp-2 leading-tight">
                  {tool.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

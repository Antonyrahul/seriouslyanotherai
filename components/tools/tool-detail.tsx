"use client";

import { ExternalLink } from "lucide-react";
import { Tool } from "@/lib/types";
import { ToolLayout } from "@/components/layout/tool-layout";
import { OtherToolsCategory } from "./other-tools-category";
import { PromoOffer } from "./promo-offer";
import Image from "next/image";
import { useState } from "react";

interface ToolDetailProps {
  tool: Tool;
  otherTools?: Tool[];
  sectionTitle?: string;
}

export function ToolDetail({
  tool,
  otherTools = [],
  sectionTitle,
}: ToolDetailProps) {
  return (
    <ToolLayout>
      {/* Contenu principal */}
      <main className="max-w-xl mx-auto py-4 md:px-4">
        {/* Header avec logo et bouton */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <ToolLogoWithSkeleton
              logoUrl={tool.logoUrl ?? undefined}
              name={tool.name}
            />
          </div>

          <a
            href={tool.url}
            target="_blank"
            rel="noopener"
            className="bg-black text-white px-3 py-1 rounded-full text-sm hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            Visit
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Titre et description */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{tool.name}</h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            {tool.description}
          </p>
        </div>

        {/* Promo Offer */}
        {tool.promoCode && tool.promoDiscount && (
          <div className="mb-4">
            <PromoOffer
              promoCode={tool.promoCode}
              promoDiscount={tool.promoDiscount}
            />
          </div>
        )}
        {/* App Screenshot */}
        {tool.appImageUrl && (
          <AppImageWithSkeleton
            src={tool.appImageUrl}
            alt={`${tool.name} app screenshot`}
          />
        )}
        {/* Section Other tools */}
        <div className="mt-16">
          <OtherToolsCategory
            tools={otherTools}
            category={tool.category}
            sectionTitle={sectionTitle}
          />
        </div>
      </main>
    </ToolLayout>
  );
}

function AppImageWithSkeleton({ src, alt }: { src: string; alt: string }) {
  const [isLoading, setIsLoading] = useState(true);
  return (
    <div className="mb-8">
      <div className="relative overflow-hidden rounded-md">
        {isLoading && (
          <div className="bg-muted absolute inset-0 z-10 animate-pulse"></div>
        )}
        <Image
          src={src}
          alt={alt}
          width={800}
          height={400}
          className="h-auto w-full object-cover"
          priority
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
}

function ToolLogoWithSkeleton({
  logoUrl,
  name,
}: {
  logoUrl?: string;
  name: string;
}) {
  const [isLoading, setIsLoading] = useState(true);
  if (logoUrl) {
    return (
      <div className="w-20 h-20 overflow-hidden relative">
        {isLoading && (
          <div className="bg-muted absolute inset-0 z-10 animate-pulse" />
        )}
        <Image
          src={logoUrl}
          alt={name}
          width={80}
          height={80}
          className="w-full h-full object-cover"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    );
  }
  return (
    <div className="w-20 h-20 rounded-md bg-gray-900 flex items-center justify-center">
      <span className="text-2xl font-bold text-white">{name.charAt(0)}</span>
    </div>
  );
}

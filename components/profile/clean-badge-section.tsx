/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants/config";

interface CleanBadgeSectionProps {
  userSlug?: string;
}

export function CleanBadgeSection({ userSlug }: CleanBadgeSectionProps) {
  const [isDark, setIsDark] = useState(false);
  const [copied, setCopied] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || SITE_CONFIG.url;
  const targetUrl = userSlug ? `${baseUrl}/${userSlug}` : baseUrl;
  const badgeUrl = `/badges/badge-${isDark ? "dark" : "light"}.svg`;

  const embedCode = `
  <a href="${targetUrl}?utm_source=${
    userSlug || SITE_CONFIG.title
  }" target="_blank">
    <img 
      src="${baseUrl}${badgeUrl}" 
      alt="Featured on ${SITE_CONFIG.title}" 
      width="175" 
      height="55" 
    />
  </a>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* Badge preview - compact */}
      <div className="p-2 mb-4 rounded-lg bg-gray-50">
        <div className="flex justify-center flex-col items-center">
          <img
            src={badgeUrl}
            alt={`Featured on ${SITE_CONFIG.title}`}
            className="w-[175px] h-[55px]"
          />
        </div>
      </div>

      {/* Controls - single compact row */}
      <div className="flex items-center justify-between">
        {/* Theme toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsDark(false)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              !isDark
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Light
          </button>
          <button
            onClick={() => setIsDark(true)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              isDark
                ? "bg-foreground text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Dark
          </button>
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy embed
            </>
          )}
        </button>
      </div>
    </div>
  );
}

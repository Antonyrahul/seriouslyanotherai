"use client";

import { useState } from "react";

interface PromoOfferProps {
  promoCode: string;
  promoDiscount: string;
}

export function PromoOffer({ promoCode, promoDiscount }: PromoOfferProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="text-center bg-muted/50 border rounded-md p-2">
      <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <span>Get {promoDiscount}% off with code</span>
        <button
          onClick={handleCopy}
          className="font-mono font-semibold px-2 py-1 bg-foreground text-background rounded hover:bg-foreground/90 transition-colors"
        >
          {copied ? "Copied!" : promoCode}
        </button>
      </div>
    </div>
  );
}

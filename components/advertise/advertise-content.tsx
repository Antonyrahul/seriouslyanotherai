"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { PlacementSelector } from "./placement-selector";
import { DatePicker } from "./date-picker";
import { PricingSummary } from "./pricing-summary";
import { ToolDetailsStep } from "./tool-details-step";
import { createAdvertiseCheckout } from "@/app/actions/advertise";
import {
  getAdvertisementDailyRate,
  calculateAdvertisementDiscount,
} from "@/lib/constants/config";
import type { Tool } from "@/lib/types";
import { DateRange } from "react-day-picker";

type PlacementType = "all" | "homepage";

interface ToolDetails {
  source: "new-ad" | "boost-tool" | "existing-ad";
  selectedToolId?: string;
  name?: string;
  url?: string;
  description?: string;
  logoUrl?: string;
  appImageUrl?: string;
  category?: string;
  promoCode?: string;
  promoDiscount?: string;
}

interface AdvertiseContentProps {
  subscriptionTools: Tool[];
}

export function AdvertiseContent({ subscriptionTools }: AdvertiseContentProps) {
  const [step, setStep] = useState<"config" | "details">("config");
  const [placementType, setPlacementType] = useState<PlacementType>("all");
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(), // Start with just today
  });

  const duration =
    date?.from && date?.to
      ? Math.max(
          1,
          Math.ceil(
            (date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24)
          ) + 1
        )
      : 1;

  // Use centralized advertisement pricing configuration
  const basePrice = getAdvertisementDailyRate(placementType);

  // Use centralized discount calculation
  const getDiscountedPrice = (days: number, base: number) => {
    const discountPercent = calculateAdvertisementDiscount(days);
    return base * (1 - discountPercent / 100);
  };

  const dailyPrice = getDiscountedPrice(duration, basePrice);
  const totalPrice = dailyPrice * duration;

  const handleConfigContinue = () => {
    setStep("details");
  };

  const handleDetailsBack = () => {
    setStep("config");
  };

  const handleDetailsSubmit = async (details: ToolDetails) => {
    if (!date?.from || !date?.to) {
      alert("Dates not selected");
      return;
    }

    try {
      const checkoutData = {
        startDate: date.from,
        endDate: date.to,
        placement: placementType,
        totalPrice: Math.round(totalPrice * 100), // Convert to cents
        duration,
        discountPercentage: calculateAdvertisementDiscount(duration),
        ...(details.source === "new-ad"
          ? {
              toolData: {
                name: details.name!,
                url: details.url!,
                description: details.description!,
                logoUrl: details.logoUrl,
                appImageUrl: details.appImageUrl, // Include app image URL if provided
                category: details.category || "tools",
                promoCode: details.promoCode, // Include promo code if provided
                promoDiscount: details.promoDiscount, // Include promo discount if provided
              },
            }
          : details.source === "boost-tool"
          ? {
              boostToolId: details.selectedToolId,
            }
          : {
              toolId: details.selectedToolId,
            }),
      };

      const result = await createAdvertiseCheckout(checkoutData);

      if (result.success && result.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = result.checkoutUrl;
      } else {
        alert(`Error creating checkout: ${result.error}`);
      }
    } catch (error) {
      console.error("Error during submission:", error);
      alert("Error creating payment");
    }
  };

  if (step === "details") {
    return (
      <ToolDetailsStep
        onBack={handleDetailsBack}
        onContinue={handleDetailsSubmit}
        totalPrice={totalPrice}
        subscriptionTools={subscriptionTools}
      />
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="px-6 h-12 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </header>

      {/* Main content */}
      <div className="px-6 pb-8">
        <div className="max-w-md mx-auto">
          {/* Title */}
          <div className="text-center mb-6 flex items-center justify-center gap-2">
            <h1 className="text-lg font-semibold">Advertise on</h1> <Logo />
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Placement Selection */}
            <PlacementSelector
              value={placementType}
              onChange={setPlacementType}
            />

            {/* Date Selection */}
            <DatePicker value={date} onChange={setDate} />

            {/* Pricing */}
            <PricingSummary
              dailyPrice={dailyPrice}
              duration={duration}
              totalPrice={totalPrice}
              discountPercent={calculateAdvertisementDiscount(duration)}
              basePrice={basePrice}
            />

            {/* Continue Button */}
            <Button
              className="w-full"
              disabled={!date?.from || !date?.to}
              onClick={handleConfigContinue}
            >
              Continue to Tool Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

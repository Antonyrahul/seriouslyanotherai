"use client";

import NumberFlow from "@number-flow/react";

interface PricingSummaryProps {
  dailyPrice: number;
  duration: number;
  totalPrice: number;
  discountPercent: number;
  basePrice: number;
}

export function PricingSummary({
  dailyPrice,
  duration,
  totalPrice,
  discountPercent,
  basePrice,
}: PricingSummaryProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Pricing</h3>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Daily rate</span>
          {discountPercent > 0 && (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
              -{discountPercent}%
            </span>
          )}
        </div>
        <div className="text-right min-h-[2.5rem] flex flex-col justify-center">
          {discountPercent > 0 && (
            <div className="text-xs text-gray-500 leading-none mb-0.5 line-through">
              ${basePrice.toFixed(2)}/day
            </div>
          )}
          <div className="text-sm font-medium leading-none">
            $
            <NumberFlow
              value={dailyPrice}
              format={{ minimumFractionDigits: 2 }}
            />
            /day
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">{duration} days</span>
        <span className="text-sm">
          $
          <NumberFlow
            value={totalPrice}
            format={{ minimumFractionDigits: 2 }}
          />
        </span>
      </div>

      <div className="border-t pt-2">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total</span>
          <span className="text-lg font-medium">
            $
            <NumberFlow
              value={totalPrice}
              format={{ minimumFractionDigits: 2 }}
            />
          </span>
        </div>
      </div>
    </div>
  );
}

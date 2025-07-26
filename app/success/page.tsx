"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { Tool } from "@/lib/types";
import { getToolById } from "@/app/actions/user-tools";
import { ToolCard } from "@/components/tools/tool-card";
import { processSuccessfulPayment } from "@/app/actions/advertise";

function SuccessContent() {
  const searchParams = useSearchParams();
  const [isToolSubmitted, setIsToolSubmitted] = useState(false);
  const [isAdvertisement, setIsAdvertisement] = useState(false);
  const [tool, setTool] = useState<Tool | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [isDirect, setIsDirect] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    const loadToolData = async () => {
      const toolSubmitted = searchParams?.get("tool-submitted");
      const toolId = searchParams?.get("toolId");
      const planParam = searchParams?.get("plan");
      const directParam = searchParams?.get("direct") === "true";
      const sessionId = searchParams?.get("sessionId");

      // Handle advertisement payments
      if (sessionId) {
        setIsAdvertisement(true);

        try {
          const result = await processSuccessfulPayment(sessionId);
          if (result.success) {
            // Payment processed successfully
            console.log("Advertisement payment processed successfully");
          } else {
            console.error(
              "Error processing advertisement payment:",
              result.error
            );
          }
        } catch (error) {
          console.error("Error processing advertisement payment:", error);
        }
      }
      // Handle tool submissions
      else if (toolSubmitted === "true" && toolId) {
        setIsToolSubmitted(true);
        setPlan(planParam);
        setIsDirect(directParam);

        try {
          const toolData = await getToolById(toolId);
          setTool(toolData);
        } catch (error) {
          console.error("Error loading tool data:", error);
        }
      }

      setIsLoading(false);
    };

    loadToolData();
  }, [searchParams]);

  const getSuccessMessage = () => {
    if (isAdvertisement) {
      return "Advertisement activated!";
    }

    if (!isToolSubmitted) return "Payment successful";

    if (isDirect) {
      return `${tool?.name || "Tool"} is now featured`;
    }

    return `${tool?.name || "Your tool"} is now live`;
  };

  const getSubMessage = () => {
    if (isAdvertisement) {
      return "Your tool is now featured and will appear at the top of listings";
    }

    if (!isToolSubmitted) return "Your payment has been processed";

    if (isDirect) {
      return "Added to your existing subscription";
    }

    const planText = plan?.includes("yearly") ? "yearly" : "monthly";
    return `Featured on ${planText} plan`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="px-6 pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-100px)] flex flex-col">
      {/* Back button */}
      <div className="px-6 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </Link>
      </div>

      {/* Main content - perfectly centered */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div>
          {/* Success Icon */}
          <div className="w-8 h-8 text-center bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-4 h-4 text-green-600" />
          </div>

          {/* Title */}
          <h1 className="text-lg font-semibold text-gray-900 mb-2 text-center">
            {getSuccessMessage()}
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-gray-600 mb-6 text-center">
            {getSubMessage()}
          </p>

          {/* Tool Card */}
          {tool && (
            <div className="mb-6 max-w-sm">
              <ToolCard
                tool={tool}
                onClick={() => {
                  if (tool.url) {
                    router.push(`/${tool.slug}`);
                  }
                }}
              />
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 text-center">
            <Link
              href="/"
              className="inline-block px-4 py-2 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              Back to Home
            </Link>
            <div className="text-center">
              <Link
                href="/profile"
                className="inline-block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                View Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

"use client";

import { ArrowLeft, Check, X } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { AdminStats } from "./admin-stats";
import { AdminUsers } from "./admin-users";
import { AdminTools } from "./admin-tools";
import { AdminAdvertisements } from "./admin-advertisements";
import { AdminSubmitForm } from "./admin-submit-form";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string;
  createdAt: Date;
  emailVerified: boolean;
  banned: boolean;
  stripeCustomerId?: string | null;
  subscriptionPlan?: string | null;
  subscriptionStatus?: string | null;
  toolsCount: number;
}

interface AdminTool {
  id: string;
  name: string;
  slug: string;
  description: string;
  url: string;
  logoUrl?: string | null;
  category?: string | null;
  featured: boolean;
  origin: string;
  requiresSubscription: boolean;
  submittedBy: string;
  createdAt: Date;
  submitterName: string;
  submitterEmail: string;
}

interface AdminAdvertisement {
  id: string;
  toolId: string;
  toolName: string;
  toolUrl: string;
  toolLogoUrl?: string | null;
  startDate: Date;
  endDate: Date;
  placement: string;
  status: string;
  totalPrice: number;
  duration: number;
  discountPercentage: number;
  submitterName: string;
  submitterEmail: string;
  createdAt: Date;
}

interface AdminStatsData {
  totalUsers: number;
  verifiedUsers: number;
  bannedUsers: number;
  adminUsers: number;
  totalTools: number;
  featuredTools: number;
  subscriptionTools: number;
  advertisementTools: number;
  activeSubscriptions: number;
  canceledSubscriptions: number;
  incompleteSubscriptions: number;
  totalRevenue: number;
  activeAds: number;
  expiredAds: number;
  mrr: number;
  churnRate: number;
}

interface TimeSeriesData {
  month: string;
  monthLabel: string;
  users: number;
  mrr: number;
  churnRate: number;
  adRevenue: number;
  activeSubscriptions: number;
  canceledSubscriptions: number;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AdminContentProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  stats: AdminStatsData;
  users: PaginatedResult<AdminUser>;
  tools: PaginatedResult<AdminTool>;
  advertisements: PaginatedResult<AdminAdvertisement>;
  timeSeriesData: TimeSeriesData[];
}

export function AdminContent({
  user,
  stats,
  users,
  tools,
  advertisements,
  timeSeriesData,
}: AdminContentProps) {
  const [activeTab, setActiveTab] = useState("stats");
  const [isSubmitMode, setIsSubmitMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Update active tab based on URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get("tab") || "stats";
    setActiveTab(tabFromUrl);
  }, []);

  const tabs = [
    { id: "stats", label: "Stats", count: null },
    { id: "users", label: "Users", count: users.total },
    { id: "tools", label: "Tools", count: tools.total },
    { id: "ads", label: "Ads", count: advertisements.total },
  ];

  const handleSubmitStart = () => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleSubmitEnd = () => {
    setIsSubmitting(false);
  };

  const handleSubmitSuccess = () => {
    setSubmitSuccess(true);
    // Auto-clear success message after 3 seconds
    setTimeout(() => setSubmitSuccess(false), 3000);
    // Return to previous tab after success
    setTimeout(() => setIsSubmitMode(false), 1000);
  };

  const handleSubmitError = (error: string) => {
    setSubmitError(error);
  };

  const renderContent = () => {
    if (isSubmitMode) {
      return (
        <AdminSubmitForm
          onSubmitStart={handleSubmitStart}
          onSubmitEnd={handleSubmitEnd}
          onSubmitSuccess={handleSubmitSuccess}
          onSubmitError={handleSubmitError}
        />
      );
    }

    switch (activeTab) {
      case "stats":
        return <AdminStats stats={stats} timeSeriesData={timeSeriesData} />;
      case "users":
        return <AdminUsers users={users} currentUserId={user.id} />;
      case "tools":
        return <AdminTools tools={tools} />;
      case "ads":
        return <AdminAdvertisements advertisements={advertisements} />;
      default:
        return <AdminStats stats={stats} timeSeriesData={timeSeriesData} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-4 sm:px-6 h-12 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="text-sm text-gray-500">Admin Panel</div>
        </div>

        <div className="flex items-center gap-3">
          {/* Success/Error messages */}
          {submitSuccess && (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-4 h-4" />
              <span className="text-sm">Tool created!</span>
            </div>
          )}
          {submitError && (
            <div className="flex items-center gap-2 text-red-600">
              <X className="w-4 h-4" />
              <span className="text-sm">{submitError}</span>
            </div>
          )}

          {/* Submit button or form controls */}
          {isSubmitMode ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsSubmitMode(false);
                  setSubmitError(null);
                  setSubmitSuccess(false);
                }}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="admin-submit-form"
                disabled={isSubmitting}
                className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create Tool"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSubmitMode(true)}
              className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded-md hover:bg-gray-800 transition-colors"
            >
              Submit Tool
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-6">
        <div className="max-w-4xl mx-auto">
          {/* Navigation - Only show when not in submit mode */}
          {!isSubmitMode && (
            <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {tab.label}
                  {tab.count !== null && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

// Export types for use in other components
export type {
  AdminUser,
  AdminTool,
  AdminAdvertisement,
  AdminStatsData,
  PaginatedResult,
};

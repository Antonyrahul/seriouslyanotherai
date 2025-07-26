/* eslint-disable react/no-unescaped-entities */
"use client";

import { ArrowLeft, Edit, CreditCard } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Tool } from "@/lib/types";
import { updateTool } from "@/app/actions/tools";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { EditToolModal } from "./edit-tool-modal";
import { ToolSelectionModal } from "./tool-selection-modal";
import { CleanBadgeSection } from "./clean-badge-section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SITE_CONFIG, SUBSCRIPTION_PLANS } from "@/lib/constants/config";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  stripeCustomerId?: string | null;
}

interface Subscription {
  id: string;
  plan: string;
  status: string | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  cancelAtPeriodEnd: boolean | null;
  stripeSubscriptionId: string | null;
}

interface ToolSelectionInfo {
  needsSelection: boolean;
  totalTools: number;
  limit: number;
  plan: string | null;
  canSelect: boolean;
  nextSelectionDate: Date | null;
}

interface UserAdvertisement {
  id: string;
  toolId: string;
  startDate: Date;
  endDate: Date;
  placement: string;
  status: string;
  totalPrice: number;
  duration: number;
  tool: {
    id: string;
    name: string;
    slug: string;
  };
  originalToolName?: string;
}

interface ProfileContentProps {
  user: User;
  userTools: Tool[]; // All tools for display
  subscriptionTools: Tool[]; // Only subscription tools for limit calculations
  userSubscription: Subscription | null;
  toolSelectionInfo: ToolSelectionInfo;
  userAdvertisements: UserAdvertisement[];
  isAdmin: boolean;
}

export function ProfileContent({
  user,
  userTools: initialTools,
  subscriptionTools,
  userSubscription,
  toolSelectionInfo,
  userAdvertisements,
  isAdmin,
}: ProfileContentProps) {
  const [userTools, setUserTools] = useState<Tool[]>(initialTools);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [selectedToolForBadge, setSelectedToolForBadge] = useState<string>(
    initialTools[0]?.slug || ""
  );

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/";
        },
      },
    });
  };

  const handleStripePortal = async () => {
    setIsLoadingPortal(true);
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        alert("Failed to access billing portal");
      }
    } catch (error) {
      console.error("Error accessing billing portal:", error);
      alert("Failed to access billing portal");
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const handleUpgrade = async (plan: string) => {
    setIsUpgrading(true);
    setUpgradingPlan(plan);
    try {
      // Préparer les paramètres d'upgrade
      const upgradeParams: {
        plan: string;
        successUrl: string;
        cancelUrl: string;
        subscriptionId?: string;
      } = {
        plan: plan,
        successUrl: `${window.location.origin}/profile`,
        cancelUrl: `${window.location.origin}/profile`,
      };

      // Si l'utilisateur a déjà un abonnement actif, passer le subscriptionId pour faire un "switch"
      if (
        userSubscription?.stripeSubscriptionId &&
        (userSubscription.status === "active" ||
          userSubscription.status === "trialing")
      ) {
        upgradeParams.subscriptionId = userSubscription.stripeSubscriptionId;
        console.log("🔄 Switching subscription:", upgradeParams.subscriptionId);
      } else {
        console.log(
          "🆕 Creating new subscription (no active subscription found)"
        );
      }

      console.log("📤 Sending upgrade params:", upgradeParams);

      const { error } = await authClient.subscription.upgrade(upgradeParams);

      if (error) {
        console.error("❌ Stripe upgrade error:", error);
        alert(`Failed to upgrade subscription: ${error.message || error}`);
      } else {
        console.log("✅ Upgrade request sent successfully");
      }
    } catch (error) {
      console.error("❌ Upgrade error:", error);
      alert(
        `Failed to upgrade subscription: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsUpgrading(false);
      setUpgradingPlan(null);
    }
  };

  const handleEdit = (tool: Tool) => {
    setEditingTool(tool);
  };

  const handleSave = async (
    toolId: string,
    updates: {
      name: string;
      description: string;
      category: string;
      promoCode?: string | null;
      promoDiscount?: string | null;
    }
  ) => {
    setIsUpdating(true);
    try {
      const result = await updateTool(toolId, {
        name: updates.name,
        description: updates.description,
        category: updates.category,
        promoCode: updates.promoCode,
        promoDiscount: updates.promoDiscount,
      });

      if (result.success && result.tool) {
        setUserTools((prev) =>
          prev.map((tool) => (tool.id === toolId ? result.tool! : tool))
        );
        setEditingTool(null);
      } else {
        alert("Failed to update tool");
      }
    } catch {
      alert("Failed to update tool");
    } finally {
      setIsUpdating(false);
    }
  };

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

  const formatPlanName = (planName: string | null) => {
    if (!planName) return "No plan";

    // Parse plan name like "starter-monthly" -> "Starter (Monthly)"
    const parts = planName.split("-");
    if (parts.length === 2) {
      const [tier, billing] = parts;
      const formattedTier = tier.charAt(0).toUpperCase() + tier.slice(1);
      const formattedBilling =
        billing.charAt(0).toUpperCase() + billing.slice(1);
      return `${formattedTier} (${formattedBilling})`;
    }

    // Fallback for unexpected formats
    return planName.charAt(0).toUpperCase() + planName.slice(1);
  };

  const getSubscriptionStatus = () => {
    if (!userSubscription) {
      return { text: "No subscription", color: "text-gray-500" };
    }

    switch (userSubscription.status) {
      case "active":
        if (userSubscription.cancelAtPeriodEnd) {
          const endDate = userSubscription.periodEnd
            ? new Date(userSubscription.periodEnd).toLocaleDateString()
            : "unknown date";
          return { text: `Active until ${endDate}`, color: "text-orange-500" };
        }
        return { text: "Active", color: "text-green-500" };
      case "canceled":
        return { text: "Canceled", color: "text-red-500" };
      case "past_due":
        return { text: "Past due", color: "text-red-500" };
      case "incomplete":
        return { text: "Incomplete", color: "text-orange-500" };
      case "incomplete_expired":
        return { text: "Expired", color: "text-red-500" };
      case "trialing":
        return { text: "Trial", color: "text-blue-500" };
      case "unpaid":
        return { text: "Unpaid", color: "text-red-500" };
      default:
        return {
          text: userSubscription.status || "Unknown",
          color: "text-gray-500",
        };
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with back button and sign out */}
      <header className="px-6 h-12 flex items-center justify-between">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
          <button
            onClick={handleSignOut}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out
          </button>
          <Link
            href="/advertise"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Advertise
          </Link>
          <Link
            href="/submit"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Submit
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Admin
            </Link>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 px-6 pt-8 pb-12">
        <div className="max-w-xl mx-auto">
          {/* Profile info */}
          <div className="text-center mb-8 flex flex-col items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-medium text-gray-600">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {user.name}
              </h1>
              <p className="text-gray-600 text-sm">{user.email}</p>
            </div>
          </div>

          {/* Badge section - Show if user has submitted tools */}
          {userTools.length > 0 && userTools.some((tool) => tool.featured) && (
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold whitespace-nowrap">
                  Your Badge
                </h2>
                <div className="flex-1 border-b border-gray-200" />
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-3">
                  Congratulations! You have submitted {userTools.length} tool
                  {userTools.length > 1 ? "s" : ""} on {SITE_CONFIG.title}. Add
                  this badge to your website to showcase your presence on our
                  platform.
                </p>

                {/* Tool selection for badge */}
                {userTools.length > 1 && (
                  <div className="mb-2">
                    <Select
                      value={selectedToolForBadge}
                      onValueChange={(value) => setSelectedToolForBadge(value)}
                    >
                      <SelectTrigger className="w-full px-3 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 h-auto shadow-none border-gray-200 focus:ring-gray-900 focus:border-transparent">
                        <SelectValue placeholder="Select tool..." />
                      </SelectTrigger>
                      <SelectContent>
                        {userTools
                          .filter((tool) => tool.origin === "subscription")
                          .map((tool) => (
                            <SelectItem key={tool.id} value={tool.slug}>
                              {tool.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <CleanBadgeSection
                  userSlug={
                    userTools.length === 1
                      ? userTools[0]?.slug
                      : selectedToolForBadge
                  }
                />
              </div>
            </div>
          )}

          {/* Subscription section */}
          {user.stripeCustomerId && userTools.length > 0 && (
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold whitespace-nowrap">
                  Subscription
                </h2>
                <div className="flex-1 border-b border-gray-200" />
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-sm">
                        {formatPlanName(userSubscription?.plan || null)}
                      </p>
                      <p className={`text-xs ${getSubscriptionStatus().color}`}>
                        {getSubscriptionStatus().text}
                        {userSubscription?.periodEnd &&
                          !userSubscription?.cancelAtPeriodEnd &&
                          ` • renews ${new Date(
                            userSubscription.periodEnd
                          ).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  {userSubscription?.status === "incomplete" ? (
                    <button
                      onClick={() => handleUpgrade("starter-monthly")}
                      disabled={isUpgrading}
                      className="text-sm bg-orange-600 text-white px-3 py-1.5 rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
                    >
                      {upgradingPlan === "starter-monthly" ? "..." : "Pay now"}
                    </button>
                  ) : (
                    <button
                      onClick={handleStripePortal}
                      disabled={isLoadingPortal}
                      className="text-sm bg-foreground text-background px-3 py-1.5 rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50"
                    >
                      {isLoadingPortal ? "Loading..." : "Manage"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tools section - REORGANIZED BY TYPE */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold whitespace-nowrap">
                My Tools ({subscriptionTools.length}/{toolSelectionInfo.limit})
              </h2>
              <div className="flex-1 border-b border-gray-200" />
            </div>

            {/* Tool Selection - Integrated in tools section */}
            {toolSelectionInfo.needsSelection && (
              <ToolSelectionModal
                tools={subscriptionTools}
                limit={toolSelectionInfo.limit}
                plan={toolSelectionInfo.plan || ""}
                canSelect={toolSelectionInfo.canSelect}
                nextSelectionDate={toolSelectionInfo.nextSelectionDate}
              />
            )}

            {subscriptionTools.length === 0 &&
            userAdvertisements.length === 0 ? (
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-sm text-gray-600 mb-3">
                  You don't have any tools yet.
                </p>
                <Link
                  href="/submit"
                  className="inline-flex items-center px-3 py-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  Submit your first tool
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Subscription Tools Section */}
                {subscriptionTools.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <h3 className="text-sm font-medium text-gray-700">
                        Subscription Tools
                      </h3>
                      <div className="text-xs text-gray-500">
                        Managed by your subscription plan
                      </div>
                    </div>
                    <div className="space-y-4">
                      {subscriptionTools.map((tool) => (
                        <div
                          key={tool.id}
                          className="rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-200"
                        >
                          {/* Main tool info */}
                          <div className="flex items-start gap-3 p-3">
                            {/* Logo */}
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

                            {/* Contenu */}
                            <div className="flex-1 min-w-0">
                              <Link href={`/${tool.slug}`} className="block">
                                <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1 hover:text-gray-700 transition-colors">
                                  {tool.name}
                                </h3>
                                <p className="text-xs text-gray-600 line-clamp-2 leading-tight">
                                  {tool.description}
                                </p>
                              </Link>
                            </div>

                            {/* Actions (statut + bouton edit côte à côte) */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {getStatusBadge(tool)}
                              <button
                                onClick={() => handleEdit(tool)}
                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 rounded transition-all duration-150"
                                title="Edit tool"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Advertisement Tools Section */}
                {userAdvertisements.length > 0 && (
                  <div className="space-y-3">
                    {(() => {
                      // Separate active and expired advertisements based on dates only
                      const now = new Date();
                      const activeAds = userAdvertisements.filter(
                        (ad) => new Date(ad.endDate) > now
                      );
                      const expiredAds = userAdvertisements.filter(
                        (ad) => new Date(ad.endDate) <= now
                      );

                      return (
                        <>
                          {/* Active Advertisement Campaigns */}
                          {activeAds.length > 0 && (
                            <div className="space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <h3 className="text-sm font-medium text-gray-700">
                                  Active Campaigns
                                </h3>
                                <div className="text-xs text-gray-500">
                                  Currently running advertising campaigns
                                </div>
                              </div>
                              <div className="space-y-4">
                                {activeAds.map((ad) => {
                                  // Find the corresponding tool
                                  const adTool = userTools.find(
                                    (t) => t.id === ad.toolId
                                  );
                                  if (!adTool) return null;

                                  return (
                                    <div
                                      key={ad.id}
                                      className="rounded-lg bg-blue-50/50 hover:bg-blue-50 transition-colors duration-200 border border-blue-100"
                                    >
                                      {/* Main tool info */}
                                      <div className="flex items-start gap-3 p-3">
                                        {/* Logo */}
                                        <div className="relative">
                                          {adTool.logoUrl ? (
                                            <div className="w-14 h-14 rounded-md overflow-hidden flex-shrink-0">
                                              <Image
                                                src={adTool.logoUrl}
                                                alt={adTool.name}
                                                width={56}
                                                height={56}
                                                className="w-full h-full object-cover"
                                              />
                                            </div>
                                          ) : (
                                            <div className="w-14 h-14 rounded-md bg-gray-900 flex items-center justify-center flex-shrink-0">
                                              <span className="text-lg font-bold text-white">
                                                {adTool.name
                                                  .charAt(0)
                                                  .toUpperCase()}
                                              </span>
                                            </div>
                                          )}
                                        </div>

                                        {/* Contenu */}
                                        <div className="flex-1 min-w-0">
                                          <Link
                                            href={`/${adTool.slug}`}
                                            className="block"
                                          >
                                            <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1 hover:text-gray-700 transition-colors">
                                              {adTool.name}
                                            </h3>
                                            <p className="text-xs text-gray-600 line-clamp-2 leading-tight">
                                              {adTool.description}
                                            </p>
                                          </Link>
                                        </div>

                                        {/* Ad Status */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-normal bg-green-50 text-green-700 border border-green-200">
                                            {ad.originalToolName
                                              ? "Boosted Tool"
                                              : "Running"}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Advertisement details */}
                                      <div className="border-t border-blue-200/50 px-3 py-2 bg-blue-50/30">
                                        <div className="flex items-center justify-between text-xs">
                                          <div className="flex items-center gap-2">
                                            <span className="text-blue-600 font-medium">
                                              {formatDate(ad.startDate)} -{" "}
                                              {formatDate(ad.endDate)}
                                            </span>
                                          </div>
                                          <span className="text-gray-500">
                                            {ad.placement === "homepage"
                                              ? "Homepage only"
                                              : "All pages"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Previous Advertisement Campaigns (Expired) */}
                          {expiredAds.length > 0 && (
                            <div className="space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <h3 className="text-sm font-medium text-gray-700">
                                  Previous Campaigns
                                </h3>
                                <div className="text-xs text-gray-500">
                                  Expired advertising campaigns
                                </div>
                              </div>
                              <div className="space-y-4">
                                {expiredAds.map((ad) => {
                                  // Find the corresponding tool
                                  const adTool = userTools.find(
                                    (t) => t.id === ad.toolId
                                  );
                                  if (!adTool) return null;

                                  return (
                                    <div
                                      key={ad.id}
                                      className="rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors duration-200 border border-gray-200 opacity-75"
                                    >
                                      {/* Main tool info */}
                                      <div className="flex items-start gap-3 p-3">
                                        {/* Logo */}
                                        <div className="relative">
                                          {adTool.logoUrl ? (
                                            <div className="w-14 h-14 rounded-md overflow-hidden flex-shrink-0 opacity-60">
                                              <Image
                                                src={adTool.logoUrl}
                                                alt={adTool.name}
                                                width={56}
                                                height={56}
                                                className="w-full h-full object-cover grayscale"
                                              />
                                            </div>
                                          ) : (
                                            <div className="w-14 h-14 rounded-md bg-gray-400 flex items-center justify-center flex-shrink-0">
                                              <span className="text-lg font-bold text-white">
                                                {adTool.name
                                                  .charAt(0)
                                                  .toUpperCase()}
                                              </span>
                                            </div>
                                          )}
                                        </div>

                                        {/* Contenu */}
                                        <div className="flex-1 min-w-0">
                                          <div className="block">
                                            <h3 className="font-semibold text-gray-500 text-sm mb-1 line-clamp-1">
                                              {adTool.name}
                                            </h3>
                                            <p className="text-xs text-gray-400 line-clamp-2 leading-tight">
                                              {adTool.description}
                                            </p>
                                          </div>
                                        </div>

                                        {/* Ad Status */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-normal bg-gray-100 text-gray-600 border border-gray-200">
                                            {ad.originalToolName
                                              ? "Boosted Tool"
                                              : "Expired"}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Advertisement details */}
                                      <div className="border-t border-gray-200/50 px-3 py-2 bg-gray-50/30">
                                        <div className="flex items-center justify-between text-xs">
                                          <div className="flex items-center gap-2">
                                            <span className="text-gray-500">
                                              {formatDate(ad.startDate)} -{" "}
                                              {formatDate(ad.endDate)}
                                            </span>
                                          </div>
                                          <span className="text-gray-400">
                                            {ad.placement === "homepage"
                                              ? "Homepage only"
                                              : "All pages"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Upgrade section - MOVED AFTER TOOLS */}
          {userTools.length >= 1 &&
            (!userSubscription || !userSubscription.plan?.includes("max")) && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold whitespace-nowrap">
                    Upgrade Plan
                  </h2>
                  <div className="flex-1 border-b border-gray-200" />
                </div>

                <div className="space-y-2">
                  {/* Plus Plan */}
                  {(!userSubscription ||
                    userSubscription.plan?.includes("starter")) && (
                    <div className="border border-gray-100 rounded-lg p-4 bg-white hover:border-gray-200 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-sm text-gray-900">
                                Plus
                              </h3>
                              <span className="inline-flex items-center px-1 rounded text-xs font-normal bg-gray-50 text-gray-600 border border-gray-200">
                                {SUBSCRIPTION_PLANS.LIMITS["plus-monthly"]}{" "}
                                tools
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Submit{" "}
                              {SUBSCRIPTION_PLANS.LIMITS["plus-monthly"] -
                                subscriptionTools.length}{" "}
                              additional tools
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleUpgrade("plus-monthly")}
                            disabled={isUpgrading}
                            className="flex-1 sm:flex-none px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors text-xs font-medium disabled:opacity-50 sm:min-w-[85px]"
                          >
                            {upgradingPlan === "plus-monthly"
                              ? "..."
                              : `$${Number(
                                  SUBSCRIPTION_PLANS.PRICES_MONTHLY[
                                    "plus-monthly"
                                  ] / 100
                                ).toFixed(2)} /month`}
                          </button>
                          <button
                            onClick={() => handleUpgrade("plus-yearly")}
                            disabled={isUpgrading}
                            className="flex-1 sm:flex-none px-4 py-2 border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-xs font-medium disabled:opacity-50 sm:min-w-[85px]"
                          >
                            {upgradingPlan === "plus-yearly"
                              ? "..."
                              : `$${Number(
                                  SUBSCRIPTION_PLANS.PRICES_YEARLY[
                                    "plus-yearly"
                                  ] / 100
                                ).toFixed(2)} /year`}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Max Plan */}
                  {(!userSubscription ||
                    userSubscription.plan?.includes("starter") ||
                    userSubscription.plan?.includes("plus")) && (
                    <div className="border border-gray-100 rounded-lg p-4 bg-white hover:border-gray-200 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-sm text-gray-900">
                                Max
                              </h3>
                              <span className="inline-flex items-center px-1 rounded text-xs font-normal bg-gray-50 text-gray-600 border border-gray-200">
                                {SUBSCRIPTION_PLANS.LIMITS["max-monthly"]} tools
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Submit{" "}
                              {SUBSCRIPTION_PLANS.LIMITS["max-monthly"] -
                                subscriptionTools.length}{" "}
                              additional tools
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleUpgrade("max-monthly")}
                            disabled={isUpgrading}
                            className="flex-1 sm:flex-none px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors text-xs font-medium disabled:opacity-50 sm:min-w-[90px]"
                          >
                            {upgradingPlan === "max-monthly"
                              ? "..."
                              : `$${Number(
                                  SUBSCRIPTION_PLANS.PRICES_MONTHLY[
                                    "max-monthly"
                                  ] / 100
                                ).toFixed(2)} /month`}
                          </button>
                          <button
                            onClick={() => handleUpgrade("max-yearly")}
                            disabled={isUpgrading}
                            className="flex-1 sm:flex-none px-4 py-2 border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-xs font-medium disabled:opacity-50 sm:min-w-[90px]"
                          >
                            {upgradingPlan === "max-yearly"
                              ? "..."
                              : `$${Number(
                                  SUBSCRIPTION_PLANS.PRICES_YEARLY[
                                    "max-yearly"
                                  ] / 100
                                ).toFixed(2)} /year`}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Edit Tool Modal */}
      {editingTool && (
        <EditToolModal
          tool={editingTool}
          isOpen={!!editingTool}
          onClose={() => setEditingTool(null)}
          onSave={handleSave}
          isUpdating={isUpdating}
        />
      )}
    </div>
  );
}

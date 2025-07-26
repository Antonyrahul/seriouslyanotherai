import { LucideIcon } from "lucide-react";

export interface Category {
  name: string;
  icon: LucideIcon;
  href: string;
  count?: number;
}

// Type Tool qui correspond EXACTEMENT au schema DB
export interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  url: string;
  logoUrl: string | null;
  appImageUrl: string | null; // Optional image of the app/tool
  category: string | null;
  featured: boolean | null;
  // Origin tracking: how was this tool created?
  origin: "subscription" | "advertisement";
  // Subscription requirement: does this tool need an active subscription to stay featured?
  requiresSubscription: boolean;
  // Boost tracking: if this is an advertisement boost of a subscription tool, this points to the original
  boostedFromId: string | null;
  // Promo code fields
  promoCode: string | null;
  promoDiscount: string | null;
  submittedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Fonction utilitaire pour générer un slug
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Fonction utilitaire pour extraire le nom de domaine
export function extractWebsite(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "";
  }
}

// =============================================================================
// ACTION RESULT TYPES - For consistent API responses across all actions
// =============================================================================

// Standard success/error response pattern used across all actions
export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Subscription plan validation result
export interface PlanLimitsResult {
  canAdd: boolean;
  reason: string;
  currentCount: number;
  limit: number;
  plan: string | null;
}

// Tool operation result with detailed feedback
export interface ToolOperationResult {
  success: boolean;
  toolId?: string;
  tool?: Tool;
  error?: string;
  affectedCount?: number;
}

// Subscription management result for user-tools actions
export interface SubscriptionManagementResult {
  success: boolean;
  action:
    | "activated"
    | "upgraded"
    | "downgraded"
    | "rebalanced"
    | "maintained"
    | "deactivated";
  limit: number;
  affectedTools: number;
  activatedCount: number;
  deactivatedCount: number;
  planInfo: {
    name: string;
    limit: number;
    isActive: boolean;
  };
}

// Admin pagination result pattern
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// Standard error messages used across actions
export const ERROR_MESSAGES = {
  AUTHENTICATION_REQUIRED: "Authentication required",
  UNAUTHORIZED: "Unauthorized access",
  MISSING_REQUIRED_FIELDS: "Missing required fields",
  DOMAIN_ALREADY_EXISTS:
    "Domain already exists. Each domain can only be submitted once.",
  NO_ACTIVE_SUBSCRIPTION: "No active subscription found",
  PLAN_LIMIT_REACHED: "Plan limit reached",
  SUBSCRIPTION_REQUIRED: "Active subscription required",
  FAILED_TO_CREATE: "Failed to create",
  FAILED_TO_UPDATE: "Failed to update",
  FAILED_TO_DELETE: "Failed to delete",
  INVALID_PARAMETERS: "Invalid parameters provided",
  SERVER_ERROR: "Internal server error",
} as const;

export const UPGRADE_MESSAGES = {
  STARTER_TO_PLUS: "Upgrade to Plus (5 tools).",
  PLUS_TO_MAX: "Upgrade to Max (10 tools).",
  MAX_TO_ENTERPRISE: "Contact us for Enterprise plan.",
} as const;

// Plan name constants for type safety
export const PLAN_NAMES = {
  STARTER_MONTHLY: "starter-monthly",
  STARTER_YEARLY: "starter-yearly",
  PLUS_MONTHLY: "plus-monthly",
  PLUS_YEARLY: "plus-yearly",
  MAX_MONTHLY: "max-monthly",
  MAX_YEARLY: "max-yearly",
} as const;

export type PlanName = (typeof PLAN_NAMES)[keyof typeof PLAN_NAMES];

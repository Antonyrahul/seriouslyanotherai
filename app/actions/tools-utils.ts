"use server";

import { db } from "@/db/drizzle";
import { tool } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateSlug, UPGRADE_MESSAGES } from "@/lib/types";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ERROR_MESSAGES, type ActionResult } from "@/lib/types";

// Extract primary domain from URL for uniqueness validation
export async function extractDomain(url: string): Promise<string> {
  try {
    const urlObj = new URL(url);
    // Remove www. for domain normalization
    return urlObj.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

// Check if domain already exists in the platform
export async function isDomainAlreadyExists(domain: string): Promise<boolean> {
  try {
    const existingTools = await db.select().from(tool);

    // Vérifier si le domaine existe déjà (pour n'importe quel utilisateur)
    for (const existingTool of existingTools) {
      const existingDomain = await extractDomain(existingTool.url);
      if (existingDomain === domain) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Error checking domain uniqueness:", error);
    return false;
  }
}

// Generate unique slug for tools to avoid conflicts
export async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existingSlug = await db
      .select({ slug: tool.slug })
      .from(tool)
      .where(eq(tool.slug, slug))
      .limit(1);

    if (existingSlug.length === 0) break;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

// =============================================================================
// CENTRALIZED AUTHENTICATION & VALIDATION UTILITIES
// =============================================================================

// Standard authentication check used across all protected actions
export async function getAuthenticatedUser(): Promise<
  ActionResult<{
    id: string;
    email: string;
    name: string;
    role?: string | null;
  }>
> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
      };
    }

    return {
      success: true,
      data: session.user,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR,
    };
  }
}

// Validate required fields for tool creation
export async function validateToolFields(fields: {
  toolUrl?: string;
  logoUrl?: string;
  name?: string;
}): Promise<ActionResult<void>> {
  if (!fields.toolUrl || !fields.logoUrl || !fields.name) {
    return {
      success: false,
      error: ERROR_MESSAGES.MISSING_REQUIRED_FIELDS,
    };
  }

  return { success: true };
}

// Enhanced domain validation with detailed error messaging
export async function validateDomainUniqueness(
  url: string
): Promise<ActionResult<string>> {
  try {
    const domain = await extractDomain(url);
    const exists = await isDomainAlreadyExists(domain);

    if (exists) {
      return {
        success: false,
        error: `${domain} ${ERROR_MESSAGES.DOMAIN_ALREADY_EXISTS}`,
      };
    }

    return {
      success: true,
      data: domain,
    };
  } catch (error) {
    console.error("Domain validation error:", error);
    return {
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR,
    };
  }
}

// Centralized plan display name generator for consistent messaging
export async function getPlanDisplayName(planName: string): Promise<string> {
  if (planName.includes("starter")) return "Starter";
  if (planName.includes("plus")) return "Plus";
  if (planName.includes("max")) return "Max";
  return "Unknown";
}

// Generate upgrade suggestion message based on current plan
export async function getUpgradeMessage(currentLimit: number): Promise<string> {
  if (currentLimit === 1) {
    return UPGRADE_MESSAGES.STARTER_TO_PLUS;
  } else if (currentLimit === 5) {
    return UPGRADE_MESSAGES.PLUS_TO_MAX;
  } else {
    return UPGRADE_MESSAGES.MAX_TO_ENTERPRISE;
  }
}

// =============================================================================
// PROMO CODE VALIDATION UTILITIES
// =============================================================================

// Validate promo code and discount pair - both must be filled together or both empty
export async function validatePromoCodePair(
  promoCode: string,
  promoDiscount: string
): Promise<{
  isValid: boolean;
  error?: string;
}> {
  const promoCodeFilled = promoCode.trim() !== "";
  const promoDiscountFilled = promoDiscount.trim() !== "";

  // Both must be filled together or both empty
  if (promoCodeFilled !== promoDiscountFilled) {
    if (promoCodeFilled && !promoDiscountFilled) {
      return {
        isValid: false,
        error: "Discount percentage is required when promo code is provided",
      };
    } else {
      return {
        isValid: false,
        error: "Promo code is required when discount percentage is provided",
      };
    }
  }

  return { isValid: true };
}

// Format promo code input (uppercase, no spaces)
export async function formatPromoCode(input: string): Promise<string> {
  return input.toUpperCase().replace(/\s/g, "");
}

// Validate promo discount percentage (1-100)
export async function validatePromoDiscount(value: string): Promise<boolean> {
  if (value === "") return true; // Empty is valid
  const numValue = parseInt(value);
  return !isNaN(numValue) && numValue >= 1 && numValue <= 100;
}

// =============================================================================
// BUSINESS LOGIC UTILITIES
// =============================================================================

// Generate plan-specific error messages for limit reached scenarios
export async function generatePlanLimitMessage(
  planName: string,
  currentCount: number,
  limit: number
): Promise<string> {
  const displayName = await getPlanDisplayName(planName);
  const upgradeMessage = await getUpgradeMessage(limit);

  return `${displayName} plan limit reached (${currentCount}/${limit} tools). ${upgradeMessage}`;
}

// Validate URL format and provide specific error messages
export async function validateToolUrl(
  url: string
): Promise<{ isValid: boolean; error?: string }> {
  if (!url.trim()) {
    return { isValid: false, error: "Tool URL is required" };
  }

  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: "Please enter a valid URL" };
  }
}

"use server";

import { db } from "@/db/drizzle";
import { tool, subscription } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { getPlanLimit } from "@/lib/constants/config";
import {
  type PlanLimitsResult,
  type ActionResult,
  ERROR_MESSAGES,
} from "@/lib/types";
import { getAuthenticatedUser } from "./tools-utils";

// Get current user's Stripe subscription details
export async function getUserSubscription() {
  const authResult = await getAuthenticatedUser();

  if (!authResult.success || !authResult.data) {
    return null;
  }

  const user = authResult.data as { stripeCustomerId?: string };

  if (!user.stripeCustomerId) {
    return null;
  }

  try {
    const userSubscription = await db
      .select()
      .from(subscription)
      .where(eq(subscription.stripeCustomerId, user.stripeCustomerId))
      .limit(1);

    return userSubscription[0] || null;
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return null;
  }
}

// Validate user tool submission limits based on subscription plan
// Uses Better Auth API for reliable subscription information
export async function checkToolLimits(): Promise<PlanLimitsResult> {
  try {
    const authResult = await getAuthenticatedUser();

    if (!authResult.success || !authResult.data) {
      return {
        canAdd: false,
        reason: ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
        currentCount: 0,
        limit: 0,
        plan: null,
      };
    }

    // Count current subscription tools for the user
    const userToolsCount = await db
      .select({ count: count() })
      .from(tool)
      .where(eq(tool.submittedBy, authResult.data.id));

    const currentCount = userToolsCount[0]?.count || 0;

    // Get active subscription via Better Auth integration
    const userSubscription = await getUserSubscription();

    if (!userSubscription || userSubscription.status !== "active") {
      return {
        canAdd: false,
        reason: ERROR_MESSAGES.NO_ACTIVE_SUBSCRIPTION,
        currentCount,
        limit: 0,
        plan: null,
      };
    }

    // Get plan limit using centralized configuration
    const limit = getPlanLimit(userSubscription.plan);

    return {
      canAdd: currentCount < limit,
      reason: currentCount >= limit ? ERROR_MESSAGES.PLAN_LIMIT_REACHED : "OK",
      currentCount,
      limit,
      plan: userSubscription.plan,
    };
  } catch (error) {
    console.error("Error checking tool limits:", error);
    return {
      canAdd: false,
      reason: "Error checking limits",
      currentCount: 0,
      limit: 0,
      plan: null,
    };
  }
}

// Pre-submission validation to ensure user can add tools within plan limits
export async function validateToolSubmission(): Promise<
  ActionResult<PlanLimitsResult>
> {
  const limitsCheck = await checkToolLimits();

  if (!limitsCheck.canAdd) {
    return {
      success: false,
      error: `Cannot add tool: ${limitsCheck.reason}. You have ${limitsCheck.currentCount}/${limitsCheck.limit} tools.`,
      data: limitsCheck,
    };
  }

  return {
    success: true,
    data: limitsCheck,
  };
}

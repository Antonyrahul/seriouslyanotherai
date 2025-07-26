"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { tool, user, subscription } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Tool } from "@/lib/types";
import { getPlanLimit } from "@/lib/constants/config";

// Get all tools belonging to authenticated user
export async function getUserTools(): Promise<Tool[]> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return [];
    }

    const userTools = await db
      .select()
      .from(tool)
      .where(eq(tool.submittedBy, session.user.id));

    return userTools;
  } catch (error) {
    console.error("Error fetching user tools:", error);
    return [];
  }
}

// Get specific tool by ID for editing (with ownership verification)
export async function getToolById(toolId: string): Promise<Tool | null> {
  try {
    // Authentication check
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Authentication required");
    }

    const tools = await db.select().from(tool).where(eq(tool.id, toolId));

    const foundTool = tools[0];

    // Ownership verification
    if (!foundTool || foundTool.submittedBy !== session.user.id) {
      throw new Error("Tool not found or access denied");
    }

    return foundTool;
  } catch (error) {
    console.error("Error fetching tool by ID:", error);
    return null;
  }
}

// Schedule tool hiding for expired subscriptions (used by cron jobs)
export async function scheduleToolHiding(
  userId: string,
  hideDate: Date | null
) {
  // The cron job /api/cron/check-expired-subscriptions automatically checks
  // and hides tools from expired subscriptions
  console.log(`Tool hiding scheduled for user ${userId} at ${hideDate}`);
}

// Check if user can make manual tool selection this month
export async function canUserSelectToolsThisMonth(): Promise<{
  canSelect: boolean;
  lastSelectionDate: Date | null;
  nextSelectionDate: Date | null;
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Authentication required");
    }

    const userData = await db
      .select({ lastToolSelectionAt: user.lastToolSelectionAt })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    const lastSelectionAt = userData[0]?.lastToolSelectionAt;

    if (!lastSelectionAt) {
      // First selection allowed
      return {
        canSelect: true,
        lastSelectionDate: null,
        nextSelectionDate: null,
      };
    }

    // Check if a month has passed since last selection
    const now = new Date();
    const nextSelectionDate = new Date(lastSelectionAt);
    nextSelectionDate.setMonth(nextSelectionDate.getMonth() + 1);

    const canSelect = now >= nextSelectionDate;

    return {
      canSelect,
      lastSelectionDate: lastSelectionAt,
      nextSelectionDate: !canSelect ? nextSelectionDate : null,
    };
  } catch (error) {
    console.error("Error checking tool selection eligibility:", error);
    throw error;
  }
}

// Save user's manual tool selection with subscription limit validation
export async function saveUserToolSelection(
  selectedToolIds: string[]
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Authentication required");
    }

    // Check if user can make selection this month
    const selectionCheck = await canUserSelectToolsThisMonth();
    if (!selectionCheck.canSelect) {
      return {
        success: false,
        message: `You can modify your selection on ${selectionCheck.nextSelectionDate?.toLocaleDateString(
          "en-US"
        )}`,
      };
    }

    // Get subscription tools only (origin: subscription)
    const { getSubscriptionTools } = await import("./tools-crud");
    const subscriptionTools = await getSubscriptionTools();

    // Validate that all selected IDs belong to user's subscription tools
    const validToolIds = subscriptionTools.map((t) => t.id);
    const invalidIds = selectedToolIds.filter(
      (id) => !validToolIds.includes(id)
    );

    if (invalidIds.length > 0) {
      return {
        success: false,
        message: "Invalid selection detected",
      };
    }

    // Check subscription limits
    const { checkToolLimits } = await import("./subscription-limits");
    const limitsCheck = await checkToolLimits();

    if (selectedToolIds.length > limitsCheck.limit) {
      return {
        success: false,
        message: `Your ${limitsCheck.plan} plan allows only ${
          limitsCheck.limit
        } active tool${limitsCheck.limit > 1 ? "s" : ""}`,
      };
    }

    // Deactivate all subscription tools first
    for (const subscriptionTool of subscriptionTools) {
      await db
        .update(tool)
        .set({
          featured: false,
          updatedAt: new Date(),
        })
        .where(eq(tool.id, subscriptionTool.id));
    }

    // Activate selected subscription tools
    for (const toolId of selectedToolIds) {
      await db
        .update(tool)
        .set({
          featured: true,
          updatedAt: new Date(),
        })
        .where(eq(tool.id, toolId));
    }

    // Update last selection timestamp
    await db
      .update(user)
      .set({
        lastToolSelectionAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id));

    console.log(
      `User ${session.user.id} manually selected ${
        selectedToolIds.length
      } tools: ${selectedToolIds.join(", ")}`
    );

    return {
      success: true,
      message: `Selection saved successfully! ${selectedToolIds.length} tool${
        selectedToolIds.length > 1 ? "s" : ""
      } activated`,
    };
  } catch (error) {
    console.error("Error saving tool selection:", error);
    return {
      success: false,
      message: "Error saving selection",
    };
  }
}

// Reset user's tool selection date to allow new selection (used when upgrading plans)
export async function resetUserToolSelection(userId: string): Promise<void> {
  try {
    await db
      .update(user)
      .set({
        lastToolSelectionAt: null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    console.log(`Reset tool selection date for user ${userId}`);
  } catch (error) {
    console.error("Error resetting user tool selection:", error);
    throw error;
  }
}

// =============================================================================
// SUBSCRIPTION LIMITS MANAGEMENT SYSTEM
// =============================================================================

// Subscription action types for tracking changes
type SubscriptionAction =
  | "activated"
  | "upgraded"
  | "downgraded"
  | "rebalanced"
  | "maintained"
  | "deactivated";

// Plan information structure
interface PlanInfo {
  name: string;
  limit: number;
  isActive: boolean;
}

// Result structure for subscription limit operations
interface SubscriptionLimitsResult {
  success: boolean;
  action: SubscriptionAction;
  limit: number; // Kept for backward compatibility
  affectedTools: number;
  activatedCount: number;
  deactivatedCount: number;
  planInfo: PlanInfo; // Additional detailed info
}

// Get user's subscription tools ordered by creation date (newest first)
async function getUserSubscriptionTools(userId: string): Promise<Tool[]> {
  return await db
    .select()
    .from(tool)
    .where(and(eq(tool.submittedBy, userId), eq(tool.origin, "subscription")))
    .orderBy(desc(tool.createdAt));
}

// Update tool featured status
async function updateToolStatus(
  toolId: string,
  featured: boolean
): Promise<void> {
  await db
    .update(tool)
    .set({
      featured,
      updatedAt: new Date(),
    })
    .where(eq(tool.id, toolId));
}

// Determine action type based on activation/deactivation counts
function determineAction(
  activatedCount: number,
  deactivatedCount: number,
  wasInactive: boolean
): SubscriptionAction {
  if (wasInactive && activatedCount > 0) return "activated";
  if (activatedCount > 0 && deactivatedCount === 0) return "upgraded";
  if (deactivatedCount > 0 && activatedCount === 0) return "downgraded";
  if (activatedCount > 0 && deactivatedCount > 0) return "rebalanced";
  if (activatedCount === 0 && deactivatedCount === 0) return "maintained";
  return "deactivated";
}

// Get subscription limits for specific user by ID (webhook-friendly)
async function getUserSubscriptionLimits(userId: string): Promise<{
  limit: number;
  plan: string | null;
}> {
  try {
    // Get subscription directly from database using userId
    // Search specifically for ACTIVE subscriptions first
    const activeSubscriptions = await db
      .select()
      .from(subscription)
      .where(
        and(
          eq(subscription.referenceId, userId),
          eq(subscription.status, "active")
        )
      )
      .limit(1);

    const activeSub = activeSubscriptions[0];

    if (activeSub) {
      // Found active subscription - use centralized config
      const limit = getPlanLimit(activeSub.plan);
      console.log(
        `✅ Found active subscription: ${activeSub.plan} (limit: ${limit})`
      );

      // Clean up incomplete subscriptions for this user
      await cleanupIncompleteSubscriptions(userId);

      return {
        limit,
        plan: activeSub.plan,
      };
    }

    // No active subscription found
    console.log(`❌ No active subscription found for user ${userId}`);
    return { limit: 0, plan: null };
  } catch (error) {
    console.error("Error getting user subscription limits:", error);
    return { limit: 0, plan: null };
  }
}

// Clean up incomplete subscriptions to prevent database pollution
async function cleanupIncompleteSubscriptions(userId: string): Promise<void> {
  try {
    const incompleteCount = await db
      .select()
      .from(subscription)
      .where(
        and(
          eq(subscription.referenceId, userId),
          eq(subscription.status, "incomplete")
        )
      );

    if (incompleteCount.length > 0) {
      console.log(
        `🧹 Cleaning up ${incompleteCount.length} incomplete subscriptions for user ${userId}`
      );

      await db
        .delete(subscription)
        .where(
          and(
            eq(subscription.referenceId, userId),
            eq(subscription.status, "incomplete")
          )
        );

      console.log(`✅ Cleaned up incomplete subscriptions for user ${userId}`);
    }
  } catch (error) {
    console.error("Error cleaning up incomplete subscriptions:", error);
  }
}

/**
 * Apply subscription limits to user's tools
 *
 * This function manages the activation/deactivation of subscription tools
 * based on the user's current subscription plan limits.
 *
 * IMPORTANT: Handles upgrade vs downgrade intelligently:
 * - UPGRADE (or equal): Apply new limits immediately
 * - DOWNGRADE: Do nothing - let cron job handle it at period end
 *
 * Detection logic: If user has more active tools than new limit allows = DOWNGRADE
 *
 * @param userId - The user ID to apply limits to
 * @param subscriptionData - Subscription information (status, plan)
 * @param forceApply - If true, apply limits even for downgrades (used by cron job)
 * @returns Promise resolving to the operation result
 *
 * @example
 * ```typescript
 * const result = await applySubscriptionLimits("user123", {
 *   status: "active",
 *   plan: "plus-monthly"
 * });
 *
 * console.log(`Action: ${result.action}, Affected: ${result.affectedTools} tools`);
 * ```
 */
export async function applySubscriptionLimits(
  userId: string,
  subscriptionData: {
    status: string;
    plan?: string;
  },
  forceApply: boolean = false
): Promise<SubscriptionLimitsResult> {
  try {
    console.log(`🔄 Applying subscription limits for user ${userId}`);

    // 1. ONLY use Better Auth database (ignore webhook data which can be stale)
    const realLimits = await getUserSubscriptionLimits(userId);

    if (realLimits.limit === 0) {
      // No active subscription found in Better Auth DB
      console.log(`❌ No active subscription found in DB for user ${userId}`);

      const planInfo = {
        name: "inactive",
        limit: 0,
        isActive: false,
      };

      return {
        success: true,
        action: "deactivated",
        limit: 0,
        affectedTools: 0,
        activatedCount: 0,
        deactivatedCount: 0,
        planInfo,
      };
    }

    // Use Better Auth DB data (source of truth after webhook processing)
    const planInfo = {
      name: realLimits.plan || "unknown",
      limit: realLimits.limit,
      isActive: true, // If we got limits > 0, subscription is active
    };

    console.log(
      `📋 Using Better Auth DB: ${realLimits.plan} (limit: ${realLimits.limit})`
    );

    // 2. Get user's subscription tools (ordered by creation date - oldest first)
    const subscriptionTools = await getUserSubscriptionTools(userId);
    console.log(`🛠️  Found ${subscriptionTools.length} subscription tools`);

    // Track initial state
    const initialActiveTools = subscriptionTools.filter(
      (tool) => tool.featured
    );
    const currentActiveCount = initialActiveTools.length;
    const wasInactive = currentActiveCount === 0;

    console.log(
      `🎯 Current state: ${currentActiveCount} active tools, new limit: ${planInfo.limit}`
    );

    // 3. Handle inactive subscription (deactivate all)
    if (!planInfo.isActive || planInfo.limit === 0) {
      console.log(
        `❌ Subscription inactive or no tools allowed - deactivating all`
      );

      // Deactivate ALL subscription tools
      for (const tool of subscriptionTools) {
        if (tool.featured) {
          await updateToolStatus(tool.id, false);
        }
      }

      return {
        success: true,
        action: "deactivated",
        limit: planInfo.limit,
        affectedTools: currentActiveCount,
        activatedCount: 0,
        deactivatedCount: currentActiveCount,
        planInfo,
      };
    }

    // 4. DETECT UPGRADE vs DOWNGRADE
    if (currentActiveCount > planInfo.limit && !forceApply) {
      // DOWNGRADE DETECTED: User has more active tools than new limit allows
      console.log(
        `🔻 DOWNGRADE DETECTED: ${currentActiveCount} active > ${planInfo.limit} limit`
      );
      console.log(
        `⏳ Keeping tools active until subscription period ends (cron job will handle it)`
      );

      return {
        success: true,
        action: "downgraded", // Action type, but no immediate changes
        limit: planInfo.limit,
        affectedTools: 0, // No tools affected immediately
        activatedCount: currentActiveCount, // Keep current count
        deactivatedCount: 0, // No tools deactivated now
        planInfo,
      };
    }

    // 5. UPGRADE OR EQUAL: Apply new limits immediately
    console.log(
      `🔺 UPGRADE/EQUAL DETECTED: Applying new limit of ${planInfo.limit} tools immediately`
    );

    // Deactivate ALL first to ensure consistent state
    for (const tool of subscriptionTools) {
      if (tool.featured) {
        await updateToolStatus(tool.id, false);
      }
    }

    // Activate exactly the allowed number (oldest first)
    const toolsToActivate = subscriptionTools.slice(0, planInfo.limit);
    for (const tool of toolsToActivate) {
      await updateToolStatus(tool.id, true);
    }

    // 6. Calculate changes
    const finalActiveCount = toolsToActivate.length;
    const netActivated = Math.max(0, finalActiveCount - currentActiveCount);
    const netDeactivated = Math.max(0, currentActiveCount - finalActiveCount);

    // 7. Determine action type
    const action = determineAction(netActivated, netDeactivated, wasInactive);

    // 8. If this was forced downgrade (cron job), reset tool selection date for immediate re-selection
    if (forceApply && netDeactivated > 0) {
      console.log(
        `🔄 Resetting tool selection date to allow immediate re-selection after forced downgrade (${netDeactivated} tools deactivated)`
      );
      await resetUserToolSelection(userId);
    }

    console.log(
      `✅ Subscription limits applied: ${action} (${finalActiveCount} tools now active, net change: +${netActivated}/-${netDeactivated})`
    );

    return {
      success: true,
      action,
      limit: planInfo.limit,
      affectedTools: netActivated + netDeactivated,
      activatedCount: finalActiveCount,
      deactivatedCount: netDeactivated,
      planInfo,
    };
  } catch (error) {
    console.error("❌ Error applying subscription limits:", error);
    throw error;
  }
}

/**
 * Check if user needs to make manual selection
 * (has more ACTIVE tools than current plan limit allows)
 *
 * IMPORTANT: This should only return true if the cron job has already
 * deactivated surplus tools, indicating that manual selection is now needed.
 */
export async function needsToolSelection(): Promise<{
  needsSelection: boolean;
  totalTools: number;
  limit: number;
  plan: string | null;
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { needsSelection: false, totalTools: 0, limit: 0, plan: null };
    }

    // Get subscription tools only (origin: subscription)
    const { getSubscriptionTools } = await import("./tools-crud");
    const subscriptionTools = await getSubscriptionTools();

    // Get subscription limits
    const { checkToolLimits } = await import("./subscription-limits");
    const limitsCheck = await checkToolLimits();

    // Count ACTIVE tools (featured: true)
    const activeTools = subscriptionTools.filter((tool) => tool.featured);
    const activeToolsCount = activeTools.length;

    console.log(
      `🔍 Tool selection check: ${activeToolsCount} active tools, ${subscriptionTools.length} total tools, limit: ${limitsCheck.limit}`
    );

    // Selection needed if:
    // 1. User has more total tools than limit (potential for selection)
    // 2. AND active tools are within or equal to limit (cron job has already acted)
    // 3. AND there are more total tools available to choose from
    const hasSurplusTools = subscriptionTools.length > limitsCheck.limit;
    const hasBeenProcessed = activeToolsCount <= limitsCheck.limit;
    const canSelectDifferentTools = subscriptionTools.length > activeToolsCount;

    const needsSelection =
      hasSurplusTools &&
      hasBeenProcessed &&
      canSelectDifferentTools &&
      limitsCheck.limit > 0;

    console.log(
      `🎯 Selection decision: surplus=${hasSurplusTools}, processed=${hasBeenProcessed}, canSelect=${canSelectDifferentTools} → needsSelection=${needsSelection}`
    );

    return {
      needsSelection,
      totalTools: subscriptionTools.length, // Total available tools
      limit: limitsCheck.limit,
      plan: limitsCheck.plan,
    };
  } catch (error) {
    console.error("Error checking if user needs tool selection:", error);
    return { needsSelection: false, totalTools: 0, limit: 0, plan: null };
  }
}

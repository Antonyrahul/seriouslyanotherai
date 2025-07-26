"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { tool, toolAdvertisement } from "@/db/schema";
import { eq, and, ne, count, notInArray, desc } from "drizzle-orm";
import { Tool, generateSlug } from "@/lib/types";
import {
  extractDomain,
  isDomainAlreadyExists,
  generateUniqueSlug,
  generatePlanLimitMessage,
} from "./tools-utils";
import { getUserSubscription } from "./subscription-limits";
import { getPlanLimit } from "@/lib/constants/config";

// Homepage tool listing with advertisement boost system
// Automatically excludes subscription tools that have active advertisement boosts
export async function getToolsPaginated(
  page: number = 1,
  limit: number = 30
): Promise<{ tools: Tool[]; hasMore: boolean; total: number }> {
  try {
    // HOMEPAGE LOGIC: Get subscription tool IDs that have active advertisement boosts
    // Homepage displays both "homepage" AND "all" placements, so exclude originals from both
    const boostedOriginalIds = await db
      .select({ originalId: tool.boostedFromId })
      .from(tool)
      .innerJoin(toolAdvertisement, eq(tool.id, toolAdvertisement.toolId))
      .where(
        and(
          eq(tool.origin, "advertisement"),
          eq(toolAdvertisement.status, "active")
          // No placement filter - homepage shows both "homepage" and "all" ads
        )
      );

    // Filter valid IDs (non-null) - these are subscription tools to exclude
    const excludeIds = boostedOriginalIds
      .map((row) => row.originalId)
      .filter((id): id is string => id !== null);

    // Fetch ONLY featured subscription tools without active boosts on homepage
    const whereConditions = [
      eq(tool.origin, "subscription"),
      eq(tool.featured, true),
    ];

    // Exclude subscription tools that have active boosts (homepage or all placements)
    if (excludeIds.length > 0) {
      whereConditions.push(notInArray(tool.id, excludeIds));
    }

    // Get total count for pagination
    const totalQuery = await db
      .select()
      .from(tool)
      .where(and(...whereConditions));

    const total = totalQuery.length;

    // Get paginated tools for current page
    const tools = await db
      .select()
      .from(tool)
      .where(and(...whereConditions))
      .orderBy(desc(tool.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const hasMore = page * limit < total;

    return { tools, hasMore, total };
  } catch (error) {
    console.error("Error fetching paginated tools:", error);
    return { tools: [], hasMore: false, total: 0 };
  }
}

// Category page tool listing with smart advertisement handling
// Excludes subscription tools that have "all" placement advertisement boosts
export async function getToolsByCategoryPaginated(
  category: string,
  page: number = 1,
  limit: number = 20
): Promise<{ tools: Tool[]; hasMore: boolean; total: number }> {
  try {
    // CATEGORY PAGES: Get subscription tool IDs that have active "all" placement boosts
    // Category pages show ONLY "all" placement ads, so exclude only those originals
    const boostedOriginalIds = await db
      .select({ originalId: tool.boostedFromId })
      .from(tool)
      .innerJoin(toolAdvertisement, eq(tool.id, toolAdvertisement.toolId))
      .where(
        and(
          eq(tool.origin, "advertisement"),
          eq(toolAdvertisement.placement, "all"), // ONLY "all" placement ads on category pages
          eq(toolAdvertisement.status, "active")
        )
      );

    // Filter valid IDs (non-null) - these are subscription tools to exclude
    const excludeIds = boostedOriginalIds
      .map((row) => row.originalId)
      .filter((id): id is string => id !== null);

    // Fetch ONLY subscription tools in this category without active "all" placement boosts
    const whereConditions = [
      eq(tool.category, category),
      eq(tool.origin, "subscription"),
      eq(tool.featured, true),
    ];

    // Exclude subscription tools with active "all" placement boosts
    if (excludeIds.length > 0) {
      whereConditions.push(notInArray(tool.id, excludeIds));
    }

    // Get total count for this category
    const totalQuery = await db
      .select()
      .from(tool)
      .where(and(...whereConditions));

    const total = totalQuery.length;

    // Get paginated tools for current page
    const tools = await db
      .select()
      .from(tool)
      .where(and(...whereConditions))
      .orderBy(desc(tool.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const hasMore = page * limit < total;

    return { tools, hasMore, total };
  } catch (error) {
    console.error("Error fetching paginated tools by category:", error);
    return { tools: [], hasMore: false, total: 0 };
  }
}

// Get individual tool by slug - only live/featured tools
export async function getToolBySlug(slug: string): Promise<Tool | null> {
  try {
    const tools = await db
      .select()
      .from(tool)
      .where(and(eq(tool.slug, slug), eq(tool.featured, true)));

    return tools[0] || null;
  } catch (error) {
    console.error("Error fetching tool by slug:", error);
    return null;
  }
}

// Get all tool slugs for static site generation
export async function getAllToolSlugs(): Promise<string[]> {
  try {
    const tools = await db
      .select({ slug: tool.slug })
      .from(tool)
      .where(eq(tool.featured, true));

    return tools.map((t) => t.slug);
  } catch (error) {
    console.error("Error fetching tool slugs:", error);
    return [];
  }
}

// Create subscription tool via normal submission flow
// First tool starts as featured:false until payment, subsequent tools are featured:true if subscription active
export async function createTool(
  toolUrl: string,
  logoUrl: string,
  name: string,
  category: string,
  description?: string,
  appImageUrl?: string | null,
  promoCode?: string,
  promoDiscount?: string
): Promise<{ success: boolean; toolId?: string; tool?: Tool; error?: string }> {
  try {
    // Authentication verification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Authentication required" };
    }

    // Validate required fields
    if (!toolUrl || !logoUrl) {
      return { success: false, error: "Missing required fields" };
    }

    // Domain uniqueness check - one domain per platform
    const domain = await extractDomain(toolUrl);
    const domainExists = await isDomainAlreadyExists(domain);

    if (domainExists) {
      return {
        success: false,
        error: `${domain} already exists. Each domain can only be submitted once.`,
      };
    }

    // Simplified logic: Check based on existing subscription tool count
    // If 0 subscription tools → First subscription tool, creation allowed for payment
    // If ≥1 subscription tools → Check subscription and limits
    const subscriptionToolsCount = await db
      .select({ count: count() })
      .from(tool)
      .where(
        and(
          eq(tool.submittedBy, session.user.id),
          eq(tool.origin, "subscription")
        )
      );

    const currentSubscriptionCount = subscriptionToolsCount[0]?.count || 0;

    if (currentSubscriptionCount >= 1) {
      // User has existing subscription tools, verify subscription and limits
      const userSubscription = await getUserSubscription();

      if (!userSubscription || userSubscription.status !== "active") {
        return {
          success: false,
          error: `You have ${currentSubscriptionCount} subscription tools. Active subscription required to add more.`,
        };
      }

      // Get plan limit using centralized configuration
      const limit = getPlanLimit(userSubscription.plan);

      if (currentSubscriptionCount >= limit) {
        return {
          success: false,
          error: await generatePlanLimitMessage(
            userSubscription.plan,
            currentSubscriptionCount,
            limit
          ),
        };
      }
    }
    // If 0 subscription tools, allow creation of first subscription tool (featured:false until payment)

    // Create tool with conditional featured status
    const toolId = `tool_${session.user.id}_${Date.now()}`;
    const toolName = name;
    const toolSlug = await generateUniqueSlug(toolName);

    // Clean description without promotional text
    const finalDescription = description || `Submitted tool: ${toolUrl}`;

    const newTool = await db
      .insert(tool)
      .values({
        id: toolId,
        name: toolName,
        slug: toolSlug,
        description: finalDescription,
        url: toolUrl,
        logoUrl: logoUrl,
        appImageUrl: appImageUrl || null,
        category: category || "productivity",
        featured: currentSubscriptionCount === 0 ? false : true, // First tool needs payment, others are immediate
        origin: "subscription", // Normal submission via subscription
        requiresSubscription: true, // Requires active subscription to stay featured
        promoCode: promoCode || null, // Store promotional code separately
        promoDiscount: promoDiscount || null, // Store promotional discount separately
        submittedBy: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log(
      `Subscription tool created: ${toolId} for user ${
        session.user.id
      }, featured: ${
        currentSubscriptionCount === 0 ? false : true
      }, subscription tools count: ${currentSubscriptionCount}`
    );

    return {
      success: true,
      toolId: newTool[0].id,
      tool: newTool[0],
    };
  } catch (error) {
    console.error("Error creating tool:", error);
    return { success: false, error: "Failed to create tool" };
  }
}

// Update existing tool details (name, description, category, promotional codes)
export async function updateTool(
  toolId: string,
  updates: {
    name?: string;
    description?: string;
    category?: string;
    promoCode?: string | null;
    promoDiscount?: string | null;
  }
): Promise<{ success: boolean; tool?: Tool; error?: string }> {
  try {
    // Authentication verification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Authentication required" };
    }

    // Verify user owns this tool
    const existingTools = await db
      .select()
      .from(tool)
      .where(eq(tool.id, toolId));
    const existingTool = existingTools[0];

    if (!existingTool || existingTool.submittedBy !== session.user.id) {
      return { success: false, error: "Tool not found or access denied" };
    }

    // Prepare update data
    const updateData: {
      name?: string;
      slug?: string;
      description?: string;
      category?: string;
      promoCode?: string | null;
      promoDiscount?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (updates.name && updates.name !== existingTool.name) {
      updateData.name = updates.name;
      updateData.slug = generateSlug(updates.name); // Regenerate slug if name changes
    }

    if (updates.description) {
      updateData.description = updates.description;
    }

    if (updates.category) {
      updateData.category = updates.category;
    }

    // Handle promotional code updates
    if ("promoCode" in updates) {
      updateData.promoCode = updates.promoCode || null;
    }

    if ("promoDiscount" in updates) {
      updateData.promoDiscount = updates.promoDiscount || null;
    }

    // Execute update
    const updatedTools = await db
      .update(tool)
      .set(updateData)
      .where(eq(tool.id, toolId))
      .returning();

    if (updatedTools.length === 0) {
      return { success: false, error: "Failed to update tool" };
    }

    console.log(`Tool updated: ${toolId} by user ${session.user.id}`);

    return {
      success: true,
      tool: updatedTools[0],
    };
  } catch (error) {
    console.error("Error updating tool:", error);
    return { success: false, error: "Internal server error" };
  }
}

// Get related tools in same category (excludes current tool)
// Smart logic excludes pure advertisement tools but allows boosted subscription tools
// Also excludes original tool if viewing an advertisement tool page
export async function getOtherToolsInCategory(
  currentToolId: string,
  category: string,
  limit: number = 6,
  currentTool?: Tool
): Promise<Tool[]> {
  try {
    // "OTHER TOOLS" SECTION: Show ONLY active subscription tools
    // Excludes pure advertisement tools but allows boosted subscription tools
    const whereConditions = [
      eq(tool.category, category),
      eq(tool.origin, "subscription"), // ONLY subscription tools (automatically excludes pure ads)
      eq(tool.featured, true),
      ne(tool.id, currentToolId),
    ];

    // If viewing an advertisement tool that boosts a subscription tool,
    // also exclude the original subscription tool to avoid duplicates
    if (currentTool?.origin === "advertisement" && currentTool?.boostedFromId) {
      whereConditions.push(ne(tool.id, currentTool.boostedFromId));
    }

    const otherTools = await db
      .select()
      .from(tool)
      .where(and(...whereConditions))
      .limit(limit);

    return otherTools;
  } catch (error) {
    console.error("Error fetching other tools in category:", error);
    return [];
  }
}

// Get general related tools (excludes current tool)
// Smart logic excludes pure advertisement tools but allows boosted subscription tools
// Also excludes original tool if viewing an advertisement tool page
export async function getOtherTools(
  currentToolId: string,
  limit: number = 6,
  currentTool?: Tool
): Promise<Tool[]> {
  try {
    // "OTHER TOOLS" SECTION: Show ONLY active subscription tools
    // Excludes pure advertisement tools but allows boosted subscription tools
    const whereConditions = [
      eq(tool.origin, "subscription"), // ONLY subscription tools (automatically excludes pure ads)
      eq(tool.featured, true),
      ne(tool.id, currentToolId),
    ];

    // If viewing an advertisement tool that boosts a subscription tool,
    // also exclude the original subscription tool to avoid duplicates
    if (currentTool?.origin === "advertisement" && currentTool?.boostedFromId) {
      whereConditions.push(ne(tool.id, currentTool.boostedFromId));
    }

    const otherTools = await db
      .select()
      .from(tool)
      .where(and(...whereConditions))
      .limit(limit);

    return otherTools;
  } catch (error) {
    console.error("Error fetching other tools:", error);
    return [];
  }
}

// Create advertisement tool via advertising flow
// These tools don't require subscription to stay active during advertisement period
export async function createAdvertisementTool(
  toolUrl: string,
  logoUrl: string,
  name: string,
  category: string,
  description?: string,
  appImageUrl?: string | null,
  promoCode?: string,
  promoDiscount?: string
): Promise<{ success: boolean; toolId?: string; tool?: Tool; error?: string }> {
  try {
    // Authentication verification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Authentication required" };
    }

    // Validate required fields
    if (!toolUrl || !logoUrl) {
      return { success: false, error: "Missing required fields" };
    }

    // Domain uniqueness check
    const domain = await extractDomain(toolUrl);
    const domainExists = await isDomainAlreadyExists(domain);

    if (domainExists) {
      return {
        success: false,
        error: `${domain} already exists. Each domain can only be submitted once.`,
      };
    }

    // Create advertisement tool (featured:false until payment)
    const toolId = `tool_${session.user.id}_${Date.now()}`;
    const toolName = name;
    const toolSlug = await generateUniqueSlug(toolName);

    // Clean description without promotional text
    const finalDescription = description || `Advertisement tool: ${toolUrl}`;

    const newTool = await db
      .insert(tool)
      .values({
        id: toolId,
        name: toolName,
        slug: toolSlug,
        description: finalDescription,
        url: toolUrl,
        logoUrl: logoUrl,
        appImageUrl: appImageUrl || null,
        category: category || "productivity",
        featured: false, // Start as false, activated when payment confirmed
        origin: "advertisement", // Created via advertisement
        requiresSubscription: false, // No subscription required during ad period
        promoCode: promoCode || null, // Store promotional code separately
        promoDiscount: promoDiscount || null, // Store promotional discount separately
        submittedBy: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log(
      `Advertisement tool created: ${toolId} for user ${session.user.id}`
    );

    return {
      success: true,
      toolId: newTool[0].id,
      tool: newTool[0],
    };
  } catch (error) {
    console.error("Error creating advertisement tool:", error);
    return { success: false, error: "Failed to create advertisement tool" };
  }
}

// Get user's subscription tools (origin: subscription)
export async function getSubscriptionTools(): Promise<Tool[]> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return [];
    }

    const subscriptionTools = await db
      .select()
      .from(tool)
      .where(
        and(
          eq(tool.submittedBy, session.user.id),
          eq(tool.origin, "subscription")
        )
      );

    return subscriptionTools;
  } catch (error) {
    console.error("Error fetching subscription tools:", error);
    return [];
  }
}

// Get user's advertisement tools (origin: advertisement)
export async function getAdvertisementTools(): Promise<Tool[]> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return [];
    }

    const advertisementTools = await db
      .select()
      .from(tool)
      .where(
        and(
          eq(tool.submittedBy, session.user.id),
          eq(tool.origin, "advertisement")
        )
      );

    return advertisementTools;
  } catch (error) {
    console.error("Error fetching advertisement tools:", error);
    return [];
  }
}

// Duplicate subscription tool to create advertisement version (boost)
export async function duplicateToolForAdvertisement(
  originalToolId: string
): Promise<{ success: boolean; toolId?: string; tool?: Tool; error?: string }> {
  try {
    // Authentication verification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Authentication required" };
    }

    // Get original tool
    const originalTools = await db
      .select()
      .from(tool)
      .where(eq(tool.id, originalToolId));

    const originalTool = originalTools[0];

    if (!originalTool || originalTool.submittedBy !== session.user.id) {
      return {
        success: false,
        error: "Original tool not found or access denied",
      };
    }

    // Verify original tool is subscription-based
    if (originalTool.origin !== "subscription") {
      return { success: false, error: "Can only boost subscription tools" };
    }

    // Check if advertisement tool already exists for this original tool
    const toolId = `${originalToolId}_ad`;
    const existingAdTool = await db
      .select()
      .from(tool)
      .where(eq(tool.id, toolId));

    if (existingAdTool.length > 0) {
      // Advertisement tool exists, check for active advertisements
      const activeAds = await db
        .select()
        .from(toolAdvertisement)
        .where(
          and(
            eq(toolAdvertisement.toolId, toolId),
            eq(toolAdvertisement.status, "active")
          )
        );

      if (activeAds.length > 0) {
        return {
          success: false,
          error: "This tool already has an active advertisement",
        };
      }

      // No active advertisements, clean up pending ones and reuse advertisement tool
      await db
        .delete(toolAdvertisement)
        .where(
          and(
            eq(toolAdvertisement.toolId, toolId),
            eq(toolAdvertisement.status, "pending")
          )
        );

      console.log(
        `Reusing existing boost advertisement tool: ${toolId} for original tool ${originalToolId}`
      );

      return {
        success: true,
        toolId: existingAdTool[0].id,
        tool: existingAdTool[0],
      };
    }

    // Create advertisement version
    const newTool = await db
      .insert(tool)
      .values({
        id: toolId,
        name: originalTool.name,
        slug: `${originalTool.slug}-ad`,
        description: originalTool.description,
        url: originalTool.url,
        logoUrl: originalTool.logoUrl,
        appImageUrl: originalTool.appImageUrl, // Copy app image from original
        category: originalTool.category,
        featured: false, // Start as false, activated when advertisement becomes active
        origin: "advertisement", // This is an advertisement version
        requiresSubscription: false, // No subscription required during ad period
        boostedFromId: originalToolId, // Link to original tool
        promoCode: originalTool.promoCode, // Copy promotional code from original
        promoDiscount: originalTool.promoDiscount, // Copy promotional discount from original
        submittedBy: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log(
      `Boost advertisement tool created: ${toolId} for original tool ${originalToolId}`
    );

    return {
      success: true,
      toolId: newTool[0].id,
      tool: newTool[0],
    };
  } catch (error) {
    console.error("Error duplicating tool for advertisement:", error);
    return { success: false, error: "Failed to create boost advertisement" };
  }
}

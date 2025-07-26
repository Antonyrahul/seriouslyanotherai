"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { user, tool, subscription, toolAdvertisement } from "@/db/schema";
import { eq, count, sql, desc, and, or, ilike } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getPlanPrice } from "@/lib/constants/config";

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

interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  bannedUsers: number;
  adminUsers: number;
  totalTools: number;
  featuredTools: number;
  subscriptionTools: number;
  advertisementTools: number;
  activeSubscriptions: number;
  cancelingSubscriptions: number; // Active but canceling at period end
  canceledSubscriptions: number;
  incompleteSubscriptions: number;
  totalRevenue: number;
  activeAds: number;
  expiredAds: number;
  mrr: number;
  churnRate: number;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Server-side admin role verification for secure operations
async function verifyAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  return session.user;
}

// Comprehensive dashboard analytics - provides MRR, churn rate, and user metrics
export async function getAdminStats(): Promise<AdminStats> {
  await verifyAdmin();

  try {
    // User metrics - verified vs unverified, banned users, admin count
    const userStats = await db
      .select({
        total: count(),
        verified: count(sql`CASE WHEN ${user.emailVerified} = true THEN 1 END`),
        banned: count(sql`CASE WHEN ${user.banned} = true THEN 1 END`),
        admins: count(sql`CASE WHEN ${user.role} = 'admin' THEN 1 END`),
      })
      .from(user)
      .then((res) => res[0]);

    // Tool metrics - only subscription tools count as "real" tools for business metrics
    const toolStats = await db
      .select({
        total: count(
          sql`CASE WHEN ${tool.origin} = 'subscription' AND ${tool.featured} = true THEN 1 END`
        ),
        featured: count(
          sql`CASE WHEN ${tool.featured} = true AND ${tool.origin} = 'subscription' THEN 1 END`
        ),
        subscription: count(
          sql`CASE WHEN ${tool.origin} = 'subscription' THEN 1 END`
        ),
        advertisement: count(
          sql`CASE WHEN ${tool.origin} = 'advertisement' THEN 1 END`
        ),
      })
      .from(tool)
      .then((res) => res[0]);

    // Subscription analytics - active vs canceling for churn calculation
    const subscriptionStats = await db
      .select({
        active: count(
          sql`CASE WHEN ${subscription.status} = 'active' AND (${subscription.cancelAtPeriodEnd} IS NULL OR ${subscription.cancelAtPeriodEnd} = false) THEN 1 END`
        ),
        cancelingAtPeriodEnd: count(
          sql`CASE WHEN ${subscription.status} = 'active' AND ${subscription.cancelAtPeriodEnd} = true THEN 1 END`
        ),
        canceled: count(
          sql`CASE WHEN ${subscription.status} IN ('canceled', 'cancelled') THEN 1 END`
        ),
        incomplete: count(
          sql`CASE WHEN ${subscription.status} = 'incomplete' THEN 1 END`
        ),
      })
      .from(subscription)
      .then((res) => res[0]);

    // MRR calculation - only count truly active subscriptions (not canceling)
    const activeSubscriptionsByPlan = await db
      .select({
        plan: subscription.plan,
        count: count(),
      })
      .from(subscription)
      .where(
        and(
          eq(subscription.status, "active"),
          or(
            sql`${subscription.cancelAtPeriodEnd} IS NULL`,
            eq(subscription.cancelAtPeriodEnd, false)
          )
        )
      )
      .groupBy(subscription.plan);

    // Monthly Recurring Revenue calculation using centralized pricing config
    const mrr = activeSubscriptionsByPlan.reduce((total, planStat) => {
      const monthlyPrice = getPlanPrice(planStat.plan);
      return total + monthlyPrice * planStat.count;
    }, 0);

    // Churn Rate calculation: (canceled + canceling) / total subscriptions * 100
    const totalChurnedSubscriptions =
      subscriptionStats.canceled + subscriptionStats.cancelingAtPeriodEnd;
    const totalSubscriptions =
      subscriptionStats.active +
      subscriptionStats.canceled +
      subscriptionStats.cancelingAtPeriodEnd;
    const churnRate =
      totalSubscriptions > 0
        ? Math.round(
            (totalChurnedSubscriptions / totalSubscriptions) * 100 * 100
          ) / 100 // Round to 2 decimals
        : 0;

    // Advertisement revenue and status tracking
    const adStats = await db
      .select({
        active: count(
          sql`CASE WHEN ${toolAdvertisement.endDate} > NOW() THEN 1 END`
        ),
        expired: count(
          sql`CASE WHEN ${toolAdvertisement.endDate} <= NOW() THEN 1 END`
        ),
      })
      .from(toolAdvertisement)
      .where(sql`${toolAdvertisement.status} != 'pending'`)
      .then((res) => res[0]);

    // Total advertisement revenue (excluding pending payments)
    const revenueStats = await db
      .select({
        total: sql`COALESCE(SUM(${toolAdvertisement.totalPrice}), 0)`,
      })
      .from(toolAdvertisement)
      .where(sql`${toolAdvertisement.status} != 'pending'`)
      .then((res) => res[0]);

    return {
      totalUsers: userStats.total,
      verifiedUsers: userStats.verified,
      bannedUsers: userStats.banned,
      adminUsers: userStats.admins,
      totalTools: toolStats.total,
      featuredTools: toolStats.featured,
      subscriptionTools: toolStats.subscription,
      advertisementTools: toolStats.advertisement,
      activeSubscriptions: subscriptionStats.active,
      cancelingSubscriptions: subscriptionStats.cancelingAtPeriodEnd,
      canceledSubscriptions: subscriptionStats.canceled,
      incompleteSubscriptions: subscriptionStats.incomplete,
      totalRevenue: Number(revenueStats.total) || 0,
      activeAds: adStats.active,
      expiredAds: adStats.expired,
      mrr,
      churnRate,
    };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    throw new Error("Failed to fetch admin stats");
  }
}

// Time series data for charts - monthly growth metrics for business intelligence
export async function getTimeSeriesData() {
  await verifyAdmin();

  try {
    // Monthly user acquisition tracking
    const userGrowth = await db
      .select({
        month: sql<Date>`DATE_TRUNC('month', ${user.createdAt})::date`.as(
          "month"
        ),
        count: count(),
      })
      .from(user)
      .groupBy(sql`DATE_TRUNC('month', ${user.createdAt})`)
      .orderBy(sql`DATE_TRUNC('month', ${user.createdAt})`);

    // Monthly subscription data for MRR trend analysis
    const subscriptionGrowth = await db
      .select({
        month:
          sql<Date>`DATE_TRUNC('month', ${subscription.periodStart})::date`.as(
            "month"
          ),
        plan: subscription.plan,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        count: count(),
      })
      .from(subscription)
      .where(sql`${subscription.periodStart} IS NOT NULL`)
      .groupBy(
        sql`DATE_TRUNC('month', ${subscription.periodStart})`,
        subscription.plan,
        subscription.status,
        subscription.cancelAtPeriodEnd
      )
      .orderBy(sql`DATE_TRUNC('month', ${subscription.periodStart})`);

    // Monthly advertisement revenue tracking
    const adRevenue = await db
      .select({
        month:
          sql<Date>`DATE_TRUNC('month', ${toolAdvertisement.createdAt})::date`.as(
            "month"
          ),
        revenue: sql<number>`SUM(${toolAdvertisement.totalPrice})`.as(
          "revenue"
        ),
      })
      .from(toolAdvertisement)
      .where(sql`${toolAdvertisement.status} != 'pending'`)
      .groupBy(sql`DATE_TRUNC('month', ${toolAdvertisement.createdAt})`)
      .orderBy(sql`DATE_TRUNC('month', ${toolAdvertisement.createdAt})`);

    // Process time series data into monthly metrics
    const monthlyData: Record<
      string,
      {
        month: string;
        users: number;
        mrr: number;
        churnRate: number;
        adRevenue: number;
        activeSubscriptions: number;
        canceledSubscriptions: number;
      }
    > = {};

    // Cumulative user growth calculation
    let cumulativeUsers = 0;
    userGrowth.forEach((item) => {
      const monthKey = new Date(item.month).toISOString().substring(0, 7); // YYYY-MM
      cumulativeUsers += item.count;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          users: 0,
          mrr: 0,
          churnRate: 0,
          adRevenue: 0,
          activeSubscriptions: 0,
          canceledSubscriptions: 0,
        };
      }
      monthlyData[monthKey].users = cumulativeUsers;
    });

    // Process subscription data for monthly MRR and churn calculations
    const monthlySubscriptions: Record<
      string,
      Record<string, { active: number; canceled: number; canceling: number }>
    > = {};

    subscriptionGrowth.forEach((item) => {
      const monthKey = new Date(item.month).toISOString().substring(0, 7);
      if (!monthlySubscriptions[monthKey]) {
        monthlySubscriptions[monthKey] = {};
      }
      if (!monthlySubscriptions[monthKey][item.plan]) {
        monthlySubscriptions[monthKey][item.plan] = {
          active: 0,
          canceled: 0,
          canceling: 0,
        };
      }

      if (
        item.status === "active" &&
        (item.cancelAtPeriodEnd === null || item.cancelAtPeriodEnd === false)
      ) {
        // Active subscriptions contributing to MRR
        monthlySubscriptions[monthKey][item.plan].active += item.count;
      } else if (item.status === "active" && item.cancelAtPeriodEnd === true) {
        // Canceling subscriptions (revenue at risk)
        monthlySubscriptions[monthKey][item.plan].canceling += item.count;
      } else if (item.status === "canceled" || item.status === "cancelled") {
        monthlySubscriptions[monthKey][item.plan].canceled += item.count;
      }
    });

    // Calculate cumulative metrics by month
    const cumulativeActiveByPlan: Record<string, number> = {};
    const cumulativeCanceledByPlan: Record<string, number> = {};
    const cumulativeCancelingByPlan: Record<string, number> = {};

    Object.keys(monthlySubscriptions)
      .sort()
      .forEach((monthKey) => {
        const monthSubs = monthlySubscriptions[monthKey];

        // Update cumulative subscription counts
        Object.keys(monthSubs).forEach((plan) => {
          if (!cumulativeActiveByPlan[plan]) cumulativeActiveByPlan[plan] = 0;
          if (!cumulativeCanceledByPlan[plan])
            cumulativeCanceledByPlan[plan] = 0;
          if (!cumulativeCancelingByPlan[plan])
            cumulativeCancelingByPlan[plan] = 0;

          cumulativeActiveByPlan[plan] += monthSubs[plan].active;
          cumulativeCanceledByPlan[plan] += monthSubs[plan].canceled;
          cumulativeCancelingByPlan[plan] += monthSubs[plan].canceling;
        });

        // Monthly MRR calculation using centralized pricing config
        const mrr = Object.keys(cumulativeActiveByPlan).reduce(
          (total, plan) => {
            const monthlyPrice = getPlanPrice(plan);
            return total + monthlyPrice * cumulativeActiveByPlan[plan];
          },
          0
        );

        // Monthly churn rate calculation
        const totalActive = Object.values(cumulativeActiveByPlan).reduce(
          (sum, count) => sum + count,
          0
        );
        const totalCanceled = Object.values(cumulativeCanceledByPlan).reduce(
          (sum, count) => sum + count,
          0
        );
        const totalCanceling = Object.values(cumulativeCancelingByPlan).reduce(
          (sum, count) => sum + count,
          0
        );
        const totalSubs = totalActive + totalCanceled + totalCanceling;
        const churnRate =
          totalSubs > 0
            ? ((totalCanceled + totalCanceling) / totalSubs) * 100
            : 0;

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            users: 0,
            mrr: 0,
            churnRate: 0,
            adRevenue: 0,
            activeSubscriptions: 0,
            canceledSubscriptions: 0,
          };
        }

        monthlyData[monthKey].mrr = mrr;
        monthlyData[monthKey].churnRate = Math.round(churnRate * 100) / 100;
        monthlyData[monthKey].activeSubscriptions = totalActive;
        monthlyData[monthKey].canceledSubscriptions =
          totalCanceled + totalCanceling;
      });

    // Add monthly advertisement revenue
    adRevenue.forEach((item) => {
      const monthKey = new Date(item.month).toISOString().substring(0, 7);
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          users: 0,
          mrr: 0,
          churnRate: 0,
          adRevenue: 0,
          activeSubscriptions: 0,
          canceledSubscriptions: 0,
        };
      }
      monthlyData[monthKey].adRevenue = Number(item.revenue) || 0;
    });

    // Return sorted time series data with formatted labels
    const sortedData = Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((item) => ({
        ...item,
        monthLabel: new Date(item.month + "-01").toLocaleDateString("fr-FR", {
          month: "short",
          year: "numeric",
        }),
      }));

    return sortedData;
  } catch (error) {
    console.error("Error fetching time series data:", error);
    throw new Error("Failed to fetch time series data");
  }
}

// Paginated user management with search and subscription details
export async function getAdminUsers(
  page: number = 1,
  pageLimit: number = 20,
  search?: string
): Promise<PaginatedResult<AdminUser>> {
  await verifyAdmin();

  try {
    const pageOffset = (page - 1) * pageLimit;

    // Search functionality for user management
    const whereCondition = search
      ? or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`))
      : undefined;

    // Get total count for pagination
    const totalResult = await db
      .select({ count: count() })
      .from(user)
      .where(whereCondition);

    const total = totalResult[0].count;

    // Get users with subscription info and tool counts
    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        createdAt: user.createdAt,
        emailVerified: user.emailVerified,
        banned: user.banned,
        stripeCustomerId: user.stripeCustomerId,
        subscriptionPlan: subscription.plan,
        subscriptionStatus: subscription.status,
        toolsCount: sql`COUNT(CASE WHEN ${tool.origin} = 'subscription' AND ${tool.featured} = true THEN ${tool.id} END)`,
      })
      .from(user)
      .leftJoin(
        subscription,
        eq(user.stripeCustomerId, subscription.stripeCustomerId)
      )
      .leftJoin(tool, eq(user.id, tool.submittedBy))
      .where(whereCondition)
      .groupBy(
        user.id,
        user.name,
        user.email,
        user.image,
        user.role,
        user.createdAt,
        user.emailVerified,
        user.banned,
        user.stripeCustomerId,
        subscription.plan,
        subscription.status
      )
      .orderBy(desc(user.createdAt))
      .limit(pageLimit)
      .offset(pageOffset);

    return {
      data: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        image: u.image,
        role: u.role || undefined,
        createdAt: u.createdAt,
        emailVerified: u.emailVerified,
        banned: u.banned || false,
        stripeCustomerId: u.stripeCustomerId,
        subscriptionPlan: u.subscriptionPlan,
        subscriptionStatus: u.subscriptionStatus,
        toolsCount: Number(u.toolsCount),
      })),
      total,
      page,
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit),
    };
  } catch (error) {
    console.error("Error fetching admin users:", error);
    throw new Error("Failed to fetch users");
  }
}

// Tool management with pagination and search - subscription tools only
export async function getAdminTools(
  page: number = 1,
  pageLimit: number = 20,
  search?: string
): Promise<PaginatedResult<AdminTool>> {
  await verifyAdmin();

  try {
    const pageOffset = (page - 1) * pageLimit;

    // Filter for subscription tools only with search capability
    const whereCondition = and(
      eq(tool.origin, "subscription"),
      search
        ? or(
            ilike(tool.name, `%${search}%`),
            ilike(tool.description, `%${search}%`)
          )
        : undefined
    );

    // Get total count for pagination
    const totalResult = await db
      .select({ count: count() })
      .from(tool)
      .where(whereCondition);

    const total = totalResult[0].count;

    // Get tools with submitter information
    const tools = await db
      .select({
        id: tool.id,
        name: tool.name,
        slug: tool.slug,
        description: tool.description,
        url: tool.url,
        logoUrl: tool.logoUrl,
        category: tool.category,
        featured: tool.featured,
        origin: tool.origin,
        requiresSubscription: tool.requiresSubscription,
        submittedBy: tool.submittedBy,
        createdAt: tool.createdAt,
        submitterName: user.name,
        submitterEmail: user.email,
      })
      .from(tool)
      .leftJoin(user, eq(tool.submittedBy, user.id))
      .where(whereCondition)
      .orderBy(desc(tool.createdAt))
      .limit(pageLimit)
      .offset(pageOffset);

    return {
      data: tools.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        description: t.description,
        url: t.url,
        logoUrl: t.logoUrl,
        category: t.category,
        featured: t.featured || false,
        origin: t.origin,
        requiresSubscription: t.requiresSubscription,
        submittedBy: t.submittedBy,
        createdAt: t.createdAt,
        submitterName: t.submitterName || "Unknown",
        submitterEmail: t.submitterEmail || "unknown@example.com",
      })),
      total,
      page,
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit),
    };
  } catch (error) {
    console.error("Error fetching admin tools:", error);
    throw new Error("Failed to fetch tools");
  }
}

// Advertisement campaign management with revenue tracking
export async function getAdminAdvertisements(
  page: number = 1,
  pageLimit: number = 20,
  search?: string
): Promise<PaginatedResult<AdminAdvertisement>> {
  await verifyAdmin();

  try {
    const pageOffset = (page - 1) * pageLimit;

    // Search across tool names and user information
    const whereCondition = search
      ? or(
          ilike(tool.name, `%${search}%`),
          ilike(user.name, `%${search}%`),
          ilike(user.email, `%${search}%`)
        )
      : undefined;

    // Get total count for pagination
    const totalResult = await db
      .select({ count: count() })
      .from(toolAdvertisement)
      .leftJoin(tool, eq(toolAdvertisement.toolId, tool.id))
      .leftJoin(user, eq(tool.submittedBy, user.id))
      .where(whereCondition);

    const total = totalResult[0].count;

    // Get advertisement campaigns with tool and user details
    const advertisements = await db
      .select({
        id: toolAdvertisement.id,
        toolId: toolAdvertisement.toolId,
        toolName: tool.name,
        toolUrl: tool.url,
        toolLogoUrl: tool.logoUrl,
        startDate: toolAdvertisement.startDate,
        endDate: toolAdvertisement.endDate,
        placement: toolAdvertisement.placement,
        status: toolAdvertisement.status,
        totalPrice: toolAdvertisement.totalPrice,
        duration: toolAdvertisement.duration,
        discountPercentage: toolAdvertisement.discountPercentage,
        submitterName: user.name,
        submitterEmail: user.email,
        createdAt: toolAdvertisement.createdAt,
      })
      .from(toolAdvertisement)
      .leftJoin(tool, eq(toolAdvertisement.toolId, tool.id))
      .leftJoin(user, eq(tool.submittedBy, user.id))
      .where(whereCondition)
      .orderBy(desc(toolAdvertisement.createdAt))
      .limit(pageLimit)
      .offset(pageOffset);

    return {
      data: advertisements.map((ad) => ({
        id: ad.id,
        toolId: ad.toolId,
        toolName: ad.toolName || "Unknown Tool",
        toolUrl: ad.toolUrl || "#",
        toolLogoUrl: ad.toolLogoUrl,
        startDate: ad.startDate,
        endDate: ad.endDate,
        placement: ad.placement,
        status: ad.status,
        totalPrice: ad.totalPrice,
        duration: ad.duration,
        discountPercentage: ad.discountPercentage || 0,
        submitterName: ad.submitterName || "Unknown",
        submitterEmail: ad.submitterEmail || "unknown@example.com",
        createdAt: ad.createdAt,
      })),
      total,
      page,
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit),
    };
  } catch (error) {
    console.error("Error fetching admin advertisements:", error);
    throw new Error("Failed to fetch advertisements");
  }
}

// Toggle tool visibility - admin control over featured status
export async function toggleToolFeatured(
  toolId: string
): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin();

  try {
    // Get current tool status
    const currentTool = await db
      .select({ featured: tool.featured })
      .from(tool)
      .where(eq(tool.id, toolId))
      .limit(1);

    if (currentTool.length === 0) {
      return { success: false, error: "Tool not found" };
    }

    // Toggle featured status
    const newFeaturedStatus = !currentTool[0].featured;

    await db
      .update(tool)
      .set({
        featured: newFeaturedStatus,
        updatedAt: new Date(),
      })
      .where(eq(tool.id, toolId));

    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Error toggling tool featured status:", error);
    return { success: false, error: "Failed to update tool" };
  }
}

// User moderation - ban functionality with reason tracking
export async function banUser(
  userId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin();

  try {
    await db
      .update(user)
      .set({
        banned: true,
        banReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("Error banning user:", error);
    return { success: false, error: "Failed to ban user" };
  }
}

// User moderation - unban functionality
export async function unbanUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin();

  try {
    await db
      .update(user)
      .set({
        banned: false,
        banReason: null,
        banExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("Error unbanning user:", error);
    return { success: false, error: "Failed to unban user" };
  }
}

// Admin tool creation - bypass normal validation for direct tool addition
export async function createAdminTool(
  toolUrl: string,
  logoUrl: string,
  name: string,
  category: string,
  description?: string,
  appImageUrl?: string | null,
  promoCode?: string,
  promoDiscount?: string
): Promise<{ success: boolean; toolId?: string; error?: string }> {
  await verifyAdmin();

  try {
    // Validate required fields
    if (!toolUrl || !logoUrl || !name || !category) {
      return { success: false, error: "Missing required fields" };
    }

    // Domain uniqueness check
    const urlObj = new URL(toolUrl);
    const domain = urlObj.hostname.replace(/^www\./, "");

    const existingTool = await db
      .select()
      .from(tool)
      .where(
        sql`LOWER(REPLACE(${
          tool.url
        }, 'https://www.', 'https://')) LIKE LOWER(${"%" + domain + "%"})`
      )
      .limit(1);

    if (existingTool.length > 0) {
      return {
        success: false,
        error: `${domain} already exists. Each domain can only be submitted once.`,
      };
    }

    // Generate unique slug for the tool
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existingSlug = await db
        .select()
        .from(tool)
        .where(eq(tool.slug, slug))
        .limit(1);

      if (existingSlug.length === 0) break;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create admin tool - always featured and subscription-based
    const toolId = `tool_admin_${Date.now()}`;
    const finalDescription = description || `no description`;

    await db.insert(tool).values({
      id: toolId,
      name,
      slug,
      description: finalDescription,
      url: toolUrl,
      logoUrl,
      category,
      featured: true, // Admin tools are always featured
      origin: "subscription",
      requiresSubscription: false,
      submittedBy: (await auth.api.getSession({ headers: await headers() }))!
        .user.id,
      appImageUrl,
      promoCode,
      promoDiscount,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    revalidatePath("/admin");

    return { success: true, toolId };
  } catch (error) {
    console.error("Error creating admin tool:", error);
    return { success: false, error: "Failed to create tool" };
  }
}

// Advertisement management - delete pending campaigns before payment
export async function deletePendingAdvertisement(
  adId: string
): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin();

  try {
    // Verify advertisement exists and is pending
    const ad = await db
      .select({ status: toolAdvertisement.status })
      .from(toolAdvertisement)
      .where(eq(toolAdvertisement.id, adId))
      .limit(1);

    if (ad.length === 0) {
      return { success: false, error: "Advertisement not found" };
    }

    if (ad[0].status !== "pending") {
      return {
        success: false,
        error: "Can only delete pending advertisements",
      };
    }

    // Delete the pending advertisement
    await db.delete(toolAdvertisement).where(eq(toolAdvertisement.id, adId));

    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("Error deleting pending advertisement:", error);
    return { success: false, error: "Failed to delete advertisement" };
  }
}

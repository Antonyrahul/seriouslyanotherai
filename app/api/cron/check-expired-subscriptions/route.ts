import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { subscription, tool } from "@/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { getPlanLimit } from "@/lib/constants/config";

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification obligatoire du cron
    const authHeader = request.headers.get("authorization");
    // Authentification obligatoire par Bearer token
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error("❌ Unauthorized cron request - invalid or missing token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔍 Checking for expired subscriptions and downgrades...");

    const now = new Date();
    const results = [];

    // === PART 1: Handle expired/cancelled subscriptions ===
    const expiredSubscriptions = await db
      .select()
      .from(subscription)
      .where(
        and(
          eq(subscription.status, "active"),
          eq(subscription.cancelAtPeriodEnd, true),
          lte(subscription.periodEnd, now)
        )
      );

    console.log(`Found ${expiredSubscriptions.length} expired subscriptions`);

    // Process expired subscriptions
    for (const sub of expiredSubscriptions) {
      try {
        // Désactiver tous les outils de l'utilisateur (subscription origin only)
        await db
          .update(tool)
          .set({
            featured: false,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(tool.submittedBy, sub.referenceId),
              eq(tool.origin, "subscription")
            )
          );

        // Mettre à jour le statut de l'abonnement
        await db
          .update(subscription)
          .set({
            status: "canceled",
          })
          .where(eq(subscription.id, sub.id));

        console.log(
          `✅ Processed expired subscription for user ${sub.referenceId}`
        );

        results.push({
          type: "expired",
          subscriptionId: sub.id,
          userId: sub.referenceId,
          success: true,
        });
      } catch (error) {
        console.error(
          `Error processing expired subscription ${sub.id}:`,
          error
        );
        results.push({
          type: "expired",
          subscriptionId: sub.id,
          userId: sub.referenceId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // === PART 2: Handle downgrades (active subscriptions with expired periods) ===
    console.log(
      "🔍 Checking for downgrade situations where paid period has ended..."
    );

    // Get all active subscriptions WHERE the paid period has ended
    const activeSubscriptions = await db
      .select()
      .from(subscription)
      .where(
        and(
          eq(subscription.status, "active"),
          lte(subscription.periodEnd, now) // Only process if paid period has ended
        )
      );

    console.log(
      `Found ${activeSubscriptions.length} active subscriptions with expired periods to check`
    );

    // Use centralized plan limits configuration

    for (const sub of activeSubscriptions) {
      try {
        if (!sub.plan) continue; // Skip subscriptions without plan

        const planLimit = getPlanLimit(sub.plan);

        if (planLimit === 0) continue; // Skip unknown plans

        // Count active subscription tools for this user
        const activeTools = await db
          .select()
          .from(tool)
          .where(
            and(
              eq(tool.submittedBy, sub.referenceId),
              eq(tool.origin, "subscription"),
              eq(tool.featured, true)
            )
          );

        const activeToolsCount = activeTools.length;

        // Check if user has more active tools than plan allows (downgrade situation)
        if (activeToolsCount > planLimit) {
          console.log(
            `🔻 DOWNGRADE ENFORCEMENT (period ended): User ${sub.referenceId} has ${activeToolsCount} tools but plan ${sub.plan} allows only ${planLimit}. Period ended: ${sub.periodEnd}`
          );

          // Import the centralized function to apply limits properly
          const { applySubscriptionLimits } = await import(
            "../../../actions/user-tools"
          );

          const result = await applySubscriptionLimits(
            sub.referenceId,
            {
              status: sub.status || "active",
              plan: sub.plan!, // Safe because we checked !sub.plan above
            },
            true
          ); // forceApply = true for cron job downgrade enforcement

          console.log(
            `✅ Applied downgrade limits for user ${sub.referenceId}:`,
            result
          );

          results.push({
            type: "downgrade",
            subscriptionId: sub.id,
            userId: sub.referenceId,
            plan: sub.plan,
            previousActiveTools: activeToolsCount,
            newLimit: planLimit,
            periodEnd: sub.periodEnd,
            success: true,
            action: result.action,
          });
        } else {
          console.log(
            `✅ User ${sub.referenceId} period ended but tools (${activeToolsCount}) within limits (${planLimit}) - no action needed`
          );
        }
      } catch (error) {
        console.error(
          `Error checking downgrade for subscription ${sub.id}:`,
          error
        );
        results.push({
          type: "downgrade",
          subscriptionId: sub.id,
          userId: sub.referenceId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // === SUMMARY ===
    const expiredCount = results.filter(
      (r) => r.type === "expired" && r.success
    ).length;
    const downgradeCount = results.filter(
      (r) => r.type === "downgrade" && r.success
    ).length;
    const errorCount = results.filter((r) => !r.success).length;

    console.log(
      `✅ Processed ${expiredCount} expired subscriptions, ${downgradeCount} downgrades, ${errorCount} errors`
    );

    return NextResponse.json({
      message: `Processed ${expiredSubscriptions.length} expired subscriptions and checked ${activeSubscriptions.length} active subscriptions for downgrades`,
      processed: {
        expired: expiredCount,
        downgrades: downgradeCount,
        errors: errorCount,
      },
      results: results,
    });
  } catch (error) {
    console.error("Error in cron job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

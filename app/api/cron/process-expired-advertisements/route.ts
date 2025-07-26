import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { toolAdvertisement, tool } from "@/db/schema";
import { eq, lte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification obligatoire du cron
    const authHeader = request.headers.get("authorization");

    // Authentification obligatoire par Bearer token
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error("❌ Unauthorized cron request - invalid or missing token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔍 Checking for expired advertisements...");

    const now = new Date();
    const results = [];

    // Trouver toutes les publicités expirées (endDate < now)
    const expiredAdvertisements = await db
      .select({
        id: toolAdvertisement.id,
        toolId: toolAdvertisement.toolId,
        endDate: toolAdvertisement.endDate,
        placement: toolAdvertisement.placement,
        tool: {
          id: tool.id,
          name: tool.name,
          origin: tool.origin,
          featured: tool.featured,
          boostedFromId: tool.boostedFromId,
        },
      })
      .from(toolAdvertisement)
      .innerJoin(tool, eq(toolAdvertisement.toolId, tool.id))
      .where(lte(toolAdvertisement.endDate, now));

    console.log(`Found ${expiredAdvertisements.length} expired advertisements`);

    // Process expired advertisements
    for (const ad of expiredAdvertisements) {
      try {
        // Seulement désactiver les outils d'origine "advertisement"
        // Les outils "subscription" boostés gardent leur statut selon leur abonnement
        if (ad.tool.origin === "advertisement" && ad.tool.featured) {
          // Mettre à jour le status de l'advertisement à "expired"
          await db
            .update(toolAdvertisement)
            .set({
              status: "expired",
              updatedAt: new Date(),
            })
            .where(eq(toolAdvertisement.id, ad.id));

          // Désactiver l'outil
          await db
            .update(tool)
            .set({
              featured: false,
              updatedAt: new Date(),
            })
            .where(eq(tool.id, ad.toolId));

          console.log(
            `✅ Expired advertisement: ${ad.tool.name} (${ad.toolId}) - status: expired, featured: false`
          );

          results.push({
            type: "advertisement_disabled",
            advertisementId: ad.id,
            toolId: ad.toolId,
            toolName: ad.tool.name,
            endDate: ad.endDate,
            placement: ad.placement,
            success: true,
          });
        } else if (ad.tool.origin === "subscription") {
          // Pour les outils boostés (origin=subscription), on ne fait rien car ils gardent leur statut d'abonnement
          console.log(
            `ℹ️ Skipped boosted subscription tool: ${ad.tool.name} (${ad.toolId}) - managed by subscription status`
          );

          results.push({
            type: "boosted_subscription_skipped",
            advertisementId: ad.id,
            toolId: ad.toolId,
            toolName: ad.tool.name,
            endDate: ad.endDate,
            placement: ad.placement,
            success: true,
          });
        } else {
          // Outil déjà désactivé
          console.log(
            `ℹ️ Advertisement tool already disabled: ${ad.tool.name} (${ad.toolId})`
          );

          results.push({
            type: "already_disabled",
            advertisementId: ad.id,
            toolId: ad.toolId,
            toolName: ad.tool.name,
            endDate: ad.endDate,
            placement: ad.placement,
            success: true,
          });
        }
      } catch (error) {
        console.error(
          `Error processing expired advertisement ${ad.id}:`,
          error
        );
        results.push({
          type: "error",
          advertisementId: ad.id,
          toolId: ad.toolId,
          toolName: ad.tool.name,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // === SUMMARY ===
    const disabledCount = results.filter(
      (r) => r.type === "advertisement_disabled" && r.success
    ).length;
    const skippedCount = results.filter(
      (r) => r.type === "boosted_subscription_skipped" && r.success
    ).length;
    const alreadyDisabledCount = results.filter(
      (r) => r.type === "already_disabled" && r.success
    ).length;
    const errorCount = results.filter((r) => !r.success).length;

    console.log(
      `✅ Processed ${expiredAdvertisements.length} expired advertisements: ${disabledCount} disabled, ${skippedCount} skipped (subscription), ${alreadyDisabledCount} already disabled, ${errorCount} errors`
    );

    return NextResponse.json({
      message: `Processed ${expiredAdvertisements.length} expired advertisements`,
      processed: {
        disabled: disabledCount,
        skipped: skippedCount,
        alreadyDisabled: alreadyDisabledCount,
        errors: errorCount,
      },
      results: results,
    });
  } catch (error) {
    console.error("Error in expired advertisements cron job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

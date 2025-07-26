"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { toolAdvertisement, tool } from "@/db/schema";
import { eq, and, desc, ne } from "drizzle-orm";
import Stripe from "stripe";
import { generateId } from "better-auth";
import { createAdvertisementTool } from "./tools-crud";
import { notifyNewAdvertisement } from "./discord-notifications";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

interface CreateAdvertiseCheckoutData {
  toolId?: string; // For existing advertisement tool
  boostToolId?: string; // For duplicating subscription tool
  toolData?: {
    // For new tool submission
    name: string;
    url: string;
    description: string;
    logoUrl?: string;
    appImageUrl?: string;
    category: string;
    promoCode?: string;
    promoDiscount?: string;
  };
  startDate: Date;
  endDate: Date;
  placement: "homepage" | "all";
  totalPrice: number; // In cents
  duration: number;
  discountPercentage: number;
}

// Create Stripe checkout session for advertisement campaigns
export async function createAdvertiseCheckout(
  data: CreateAdvertiseCheckoutData
) {
  try {
    // Authentication verification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Not authenticated");
    }

    const user = session.user as { stripeCustomerId?: string };

    if (!user.stripeCustomerId) {
      throw new Error("No Stripe customer found");
    }

    // Create or get tool based on advertisement type
    let finalToolId = data.toolId;

    if (!finalToolId && data.boostToolId) {
      // Duplicate subscription tool for advertisement boost
      const { duplicateToolForAdvertisement } = await import("./tools-crud");
      const result = await duplicateToolForAdvertisement(data.boostToolId);

      if (!result.success || !result.toolId) {
        throw new Error(
          result.error || "Failed to duplicate tool for advertisement"
        );
      }

      finalToolId = result.toolId;
    } else if (!finalToolId && data.toolData) {
      // Create new advertisement tool
      const result = await createAdvertisementTool(
        data.toolData.url,
        data.toolData.logoUrl || "",
        data.toolData.name,
        data.toolData.category,
        data.toolData.description,
        data.toolData.appImageUrl || "",
        data.toolData.promoCode || undefined,
        data.toolData.promoDiscount || undefined
      );

      if (!result.success || !result.toolId) {
        throw new Error(result.error || "Failed to create advertisement tool");
      }

      finalToolId = result.toolId;
    }

    if (!finalToolId) {
      throw new Error("Tool not specified");
    }

    // Create pending advertisement campaign
    const advertisement = await db
      .insert(toolAdvertisement)
      .values({
        id: generateId(),
        toolId: finalToolId,
        startDate: data.startDate,
        endDate: data.endDate,
        placement: data.placement,
        status: "pending",
        totalPrice: data.totalPrice,
        duration: data.duration,
        discountPercentage: data.discountPercentage,
      })
      .returning();

    // Get tool data for checkout metadata
    const toolData = await db
      .select()
      .from(tool)
      .where(eq(tool.id, finalToolId))
      .limit(1);

    if (!toolData[0]) {
      throw new Error("Tool not found");
    }

    const selectedTool = toolData[0];

    // Create Stripe checkout session with tax collection
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: user.stripeCustomerId,
      customer_update: {
        name: "auto", // Required for tax_id_collection
        address: "auto", // Required for automatic tax calculation
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Advertisement - ${selectedTool.name}`,
              description: `${
                data.placement === "homepage" ? "Homepage only" : "All pages"
              } placement for ${data.duration} day${
                data.duration > 1 ? "s" : ""
              }`,
              images: selectedTool.logoUrl ? [selectedTool.logoUrl] : undefined,
            },
            unit_amount: Math.round(data.totalPrice / data.duration),
          },
          quantity: data.duration,
        },
      ],
      metadata: {
        advertisementId: advertisement[0].id,
        toolId: finalToolId,
        placement: data.placement,
        duration: data.duration.toString(),
        discountPercentage: data.discountPercentage.toString(),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?sessionId={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/advertise`,
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },
      invoice_creation: { enabled: true },
    });

    // Link Stripe session to advertisement
    await db
      .update(toolAdvertisement)
      .set({
        stripeSessionId: checkoutSession.id,
        updatedAt: new Date(),
      })
      .where(eq(toolAdvertisement.id, advertisement[0].id));

    return {
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    };
  } catch (error) {
    console.error("Error creating checkout:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get active advertisements by placement (homepage, all pages, or both)
export async function getActiveAdvertisements(placement?: "homepage" | "all") {
  try {
    // Build WHERE condition - use STATUS as source of truth for better performance
    const whereConditions = [eq(toolAdvertisement.status, "active")];

    if (placement) {
      whereConditions.push(eq(toolAdvertisement.placement, placement));
    }

    // Using status = 'active' instead of date calculations for better performance
    const advertisements = await db
      .select({
        id: toolAdvertisement.id,
        toolId: toolAdvertisement.toolId,
        startDate: toolAdvertisement.startDate,
        endDate: toolAdvertisement.endDate,
        placement: toolAdvertisement.placement,
        tool: {
          id: tool.id,
          name: tool.name,
          slug: tool.slug,
          description: tool.description,
          url: tool.url,
          logoUrl: tool.logoUrl,
          appImageUrl: tool.appImageUrl,
          category: tool.category,
        },
      })
      .from(toolAdvertisement)
      .innerJoin(tool, eq(toolAdvertisement.toolId, tool.id))
      .where(and(...whereConditions))
      .orderBy(desc(toolAdvertisement.startDate));

    return advertisements.map((ad) => ({
      ...ad.tool,
      advertisementId: ad.id,
      placement: ad.placement,
      startDate: ad.startDate,
      endDate: ad.endDate,
    }));
  } catch (error) {
    console.error("Error fetching advertisements:", error);
    return [];
  }
}

// Get homepage-specific advertisements
export async function getHomepageAdvertisements() {
  return getActiveAdvertisements("homepage");
}

// Get all-pages advertisements
export async function getAllPagesAdvertisements() {
  return getActiveAdvertisements("all");
}

// Process successful advertisement payment from Stripe webhook
export async function processSuccessfulPayment(sessionId: string): Promise<{
  success: boolean;
  advertisementId?: string;
  alreadyProcessed?: boolean;
  error?: string;
}> {
  try {
    // Retrieve and verify Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      throw new Error("Payment not confirmed");
    }

    const advertisementId = session.metadata?.advertisementId;
    if (!advertisementId) {
      throw new Error("Advertisement ID missing in metadata");
    }

    // Check if advertisement already processed to avoid duplicates
    const existingAd = await db
      .select()
      .from(toolAdvertisement)
      .where(eq(toolAdvertisement.id, advertisementId))
      .limit(1);

    if (existingAd[0]?.status === "active") {
      console.log(`Advertisement ${advertisementId} already processed`);
      return {
        success: true,
        advertisementId,
        alreadyProcessed: true,
      };
    }

    // Activate advertisement campaign
    await db
      .update(toolAdvertisement)
      .set({
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(toolAdvertisement.id, advertisementId));

    // Get advertisement details for tool activation and notifications
    const advertisement = await db
      .select({
        id: toolAdvertisement.id,
        toolId: toolAdvertisement.toolId,
        duration: toolAdvertisement.duration,
        totalPrice: toolAdvertisement.totalPrice,
        placement: toolAdvertisement.placement,
        tool: {
          name: tool.name,
          submittedBy: tool.submittedBy,
        },
      })
      .from(toolAdvertisement)
      .innerJoin(tool, eq(toolAdvertisement.toolId, tool.id))
      .where(eq(toolAdvertisement.id, advertisementId))
      .limit(1);

    if (advertisement[0]) {
      // Activate tool (set as featured)
      await db
        .update(tool)
        .set({
          featured: true,
          updatedAt: new Date(),
        })
        .where(eq(tool.id, advertisement[0].toolId));

      // Get customer information from Stripe for notifications
      const customer = await stripe.customers.retrieve(
        session.customer as string
      );
      const customerEmail =
        customer && !customer.deleted ? customer.email : null;
      const customerName = customer && !customer.deleted ? customer.name : null;

      // Send Discord notification for new advertisement
      try {
        await notifyNewAdvertisement({
          userEmail: customerEmail || undefined,
          userName: customerName || undefined,
          toolName: advertisement[0].tool.name,
          amount: advertisement[0].totalPrice,
          currency: session.currency || "usd",
          duration: `${advertisement[0].duration} day${
            advertisement[0].duration > 1 ? "s" : ""
          } (${
            advertisement[0].placement === "homepage"
              ? "Homepage only"
              : "All pages"
          })`,
        });
      } catch (error) {
        console.error(
          "Error sending Discord notification for advertisement:",
          error
        );
      }
    }

    return {
      success: true,
      advertisementId,
    };
  } catch (error) {
    console.error("Error processing payment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get user's advertisement campaigns (excludes pending campaigns)
export async function getUserAdvertisements() {
  try {
    // Authentication check
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return [];
    }

    // Only retrieve advertisements that are NOT pending (active or expired)
    const advertisements = await db
      .select({
        id: toolAdvertisement.id,
        toolId: toolAdvertisement.toolId,
        startDate: toolAdvertisement.startDate,
        endDate: toolAdvertisement.endDate,
        placement: toolAdvertisement.placement,
        status: toolAdvertisement.status,
        totalPrice: toolAdvertisement.totalPrice,
        duration: toolAdvertisement.duration,
        tool: {
          id: tool.id,
          name: tool.name,
          slug: tool.slug,
          boostedFromId: tool.boostedFromId,
        },
      })
      .from(toolAdvertisement)
      .innerJoin(tool, eq(toolAdvertisement.toolId, tool.id))
      .where(
        and(
          eq(tool.submittedBy, session.user.id),
          ne(toolAdvertisement.status, "pending") // Exclude pending advertisements
        )
      )
      .orderBy(desc(toolAdvertisement.startDate));

    // For boosted tools, get original tool name for display
    const enrichedAdvertisements = await Promise.all(
      advertisements.map(async (ad) => {
        let originalToolName = undefined;
        if (ad.tool.boostedFromId) {
          const originalTool = await db
            .select({
              name: tool.name,
            })
            .from(tool)
            .where(eq(tool.id, ad.tool.boostedFromId))
            .limit(1);

          originalToolName = originalTool[0]?.name || undefined;
        }

        return {
          ...ad,
          originalToolName,
        };
      })
    );

    return enrichedAdvertisements;
  } catch (error) {
    console.error("Error fetching user advertisements:", error);
    return [];
  }
}

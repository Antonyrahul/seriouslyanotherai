import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";
import { db } from "@/db/drizzle";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { processSuccessfulPayment } from "@/app/actions/advertise";
import {
  notifyNewCustomer,
  notifySubscriptionNew,
  notifySubscriptionUpdate,
} from "@/app/actions/discord-notifications";
import { getPlanLimit } from "@/lib/constants/config";

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

export const auth = betterAuth({
  trustedOrigins: [`${process.env.NEXT_PUBLIC_APP_URL}`],
  allowedDevOrigins: [`${process.env.NEXT_PUBLIC_APP_URL}`],
  cookieCache: {
    enabled: true,
    maxAge: 5 * 60,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },

  plugins: [
    admin({}),
    nextCookies(),
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        plans: [
          {
            name: "starter-monthly",
            priceId: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID!,
            limits: {
              tools: getPlanLimit("starter-monthly"),
            },
          },
          {
            name: "starter-yearly",
            priceId: process.env.STRIPE_STARTER_YEARLY_PRICE_ID!,
            limits: {
              tools: getPlanLimit("starter-yearly"),
            },
          },
          {
            name: "plus-monthly",
            priceId: process.env.STRIPE_PLUS_MONTHLY_PRICE_ID!,
            limits: {
              tools: getPlanLimit("plus-monthly"),
            },
          },
          {
            name: "plus-yearly",
            priceId: process.env.STRIPE_PLUS_YEARLY_PRICE_ID!,
            limits: {
              tools: getPlanLimit("plus-yearly"),
            },
          },
          {
            name: "max-monthly",
            priceId: process.env.STRIPE_MAX_MONTHLY_PRICE_ID!,
            limits: {
              tools: getPlanLimit("max-monthly"),
            },
          },
          {
            name: "max-yearly",
            priceId: process.env.STRIPE_MAX_YEARLY_PRICE_ID!,
            limits: {
              tools: getPlanLimit("max-yearly"),
            },
          },
        ],
        getCheckoutSessionParams: async ({ user, plan }) => {
          console.log(
            "🚀 getCheckoutSessionParams called with plan:",
            plan.name
          );

          const params: Stripe.Checkout.SessionCreateParams = {
            // Allow customers to enter tax information for businesses
            tax_id_collection: {
              enabled: true,
            },

            // Metadata configuration
            metadata: {
              userId: user.id,
              planName: plan.name,
            },
          };

          // 🎉 Automatically apply $1 promo for starter monthly
          if (plan.name === "starter-monthly" && process.env.STRIPE_COUPON_ID) {
            console.log(
              "🎯 Applying automatic discount for starter-monthly plan"
            );
            console.log("🎫 Coupon ID from env:", process.env.STRIPE_COUPON_ID);

            params.discounts = [
              {
                coupon: process.env.STRIPE_COUPON_ID,
              },
            ];
            console.log("✅ Automatic discount applied:", params.discounts);
          } else {
            // Allow manual promo codes for other plans or if no auto coupon
            params.allow_promotion_codes = true;
            console.log("🎫 Manual promotion codes enabled");
          }

          console.log("📋 Final checkout params:", params);
          return { params };
        },
      },
      // new customer discord notification
      onCustomerCreate: async ({ customer, user }) => {
        console.log(`Customer ${customer.id} created for user ${user.id}`);
        await notifyNewCustomer({
          userEmail: user.email,
          userName: user.name,
        });
      },
      getCustomerCreateParams: async ({ user }) => {
        return {
          metadata: {
            userId: user.id,
            email: user.email,
          },
        };
      },

      onEvent: async (event) => {
        console.log(`📨 Stripe event received: ${event.type}`);

        // 💳🎪 TOUS PAIEMENTS RÉUSSIS - Handle both subscriptions and advertisements
        if (event.type === "checkout.session.completed") {
          const session = event.data.object;

          // 🎪 ADVERTISEMENT PAYMENT
          if (session.metadata?.advertisementId) {
            console.log(`🎪 Processing advertisement payment: ${session.id}`);

            try {
              const result = await processSuccessfulPayment(session.id);

              if (result.success) {
                console.log(
                  `✅ Advertisement activated: ${result.advertisementId}`
                );
              } else {
                console.error(
                  `❌ Failed to activate advertisement: ${result.error}`
                );
              }
            } catch (error) {
              console.error(
                "❌ Error processing advertisement payment:",
                error
              );
            }
          }
          // 💳 SUBSCRIPTION PAYMENT (NEW)
          else if (session.mode === "subscription") {
            console.log(
              `💳 [CHECKOUT] Processing subscription payment: ${session.id}`
            );

            try {
              const customer = await stripeClient.customers.retrieve(
                session.customer as string
              );

              if (customer && !customer.deleted && customer.metadata?.userId) {
                const userId = customer.metadata.userId;

                // Get subscription to determine plan
                const subscriptions = await stripeClient.subscriptions.list({
                  customer: session.customer as string,
                  status: "active",
                  limit: 1,
                });

                if (subscriptions.data.length > 0) {
                  const subscription = subscriptions.data[0];
                  const currentPriceId = subscription.items.data[0]?.price.id;

                  // Déterminer le plan à partir du priceId
                  const planName = currentPriceId
                    ? Object.keys(process.env)
                        .find(
                          (key) =>
                            key.includes("PRICE_ID") &&
                            process.env[key] === currentPriceId
                        )
                        ?.replace("STRIPE_", "")
                        .replace("_PRICE_ID", "")
                        .toLowerCase()
                        .replace("_", "-")
                    : null;

                  // Importer la fonction de traitement
                  const { applySubscriptionLimits } = await import(
                    "../app/actions/user-tools"
                  );

                  console.log(
                    `🔄 [CHECKOUT] Processing new subscription for user: ${userId} - Plan: ${planName}`
                  );

                  // 🧹 Clean up incomplete subscriptions BEFORE applying limits
                  console.log(
                    `🧹 [CHECKOUT] Cleaning up incomplete subscriptions for user: ${userId}`
                  );
                  try {
                    const { db } = await import("../db/drizzle");
                    const { subscription: subscriptionTable } = await import(
                      "../db/schema"
                    );
                    const { and, eq } = await import("drizzle-orm");

                    await db
                      .delete(subscriptionTable)
                      .where(
                        and(
                          eq(subscriptionTable.referenceId, userId),
                          eq(subscriptionTable.status, "incomplete")
                        )
                      );
                    console.log(
                      `✅ [CHECKOUT] Cleaned up incomplete subscriptions for user: ${userId}`
                    );
                  } catch (cleanupError) {
                    console.error(
                      `❌ [CHECKOUT] Error cleaning up incomplete subscriptions:`,
                      cleanupError
                    );
                  }

                  const result = await applySubscriptionLimits(userId, {
                    status: "active",
                    plan: planName ?? undefined,
                  });

                  await notifySubscriptionNew();

                  console.log(
                    `✅ Tools activated for new subscription:`,
                    result
                  );
                }
              }
            } catch (error) {
              console.error("❌ Error processing subscription payment:", error);
            }
          }
        }

        // 🔄 SUBSCRIPTION UPDATES - Handle subscription changes (after Better Auth DB update)
        else if (event.type === "customer.subscription.updated") {
          console.log(`🔄 [ONEVENT] Processing subscription update`);

          try {
            const subscription = event.data.object;

            // Get customer to find userId
            const customer = await stripeClient.customers.retrieve(
              subscription.customer as string
            );

            if (customer && !customer.deleted && customer.metadata?.userId) {
              const userId = customer.metadata.userId;

              console.log(
                `🔄 [ONEVENT] Processing subscription update for user: ${userId}`
              );

              // Import functions
              const { applySubscriptionLimits } = await import(
                "../app/actions/user-tools"
              );

              // Apply subscription limits (Better Auth DB should be updated by now)
              const result = await applySubscriptionLimits(userId, {
                status: subscription.status,
                plan: undefined, // Let the function read from Better Auth DB
              });

              await notifySubscriptionUpdate();

              console.log(`✅ [ONEVENT] Subscription limits applied:`, result);
            }
          } catch (error) {
            console.error("❌ Error in customer.subscription.updated:", error);
          }
        }
      },
    }),
  ],
});

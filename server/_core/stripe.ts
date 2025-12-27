import type { Express, Request, Response } from "express";
import Stripe from "stripe";
import { getUser, updateUserSubscription } from "../db";
import { ENV } from "./env";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

/**
 * Register Stripe routes
 */
export function registerStripeRoutes(app: Express) {
  /**
   * Create Stripe Checkout Session
   * POST /api/stripe/checkout
   * Body: { planType: "pro" | "business", userId: string }
   */
  (app as any).post("/api/stripe/checkout", async (req: Request, res: Response) => {
    try {
      const reqAny = req as any;
      const { planType, userId } = reqAny.body || {};

      if (!planType || !userId) {
        (res as any).status(400).json({ error: "planType and userId are required" });
        return;
      }

      if (planType !== "pro" && planType !== "business") {
        (res as any).status(400).json({ error: "planType must be 'pro' or 'business'" });
        return;
      }

      // Get user to check if they already have a Stripe customer ID
      const user = await getUser(userId);
      if (!user) {
        (res as any).status(404).json({ error: "User not found" });
        return;
      }

      // Get price IDs from environment variables
      const priceId = planType === "pro" 
        ? process.env.STRIPE_PRICE_ID_PRO 
        : process.env.STRIPE_PRICE_ID_BUSINESS;

      if (!priceId) {
        console.error(`[Stripe] Missing price ID for plan: ${planType}`);
        (res as any).status(500).json({ 
          error: `Stripe price ID not configured for ${planType} plan` 
        });
        return;
      }

      // Get or create Stripe customer
      let customerId = user.stripeCustomerId;

      if (!customerId) {
        // Create new Stripe customer
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name || undefined,
          metadata: {
            userId: userId,
          },
        });
        customerId = customer.id;

        // Save customer ID to database
        await updateUserSubscription(userId, {
          stripeCustomerId: customerId,
        });
      }

      // Get base URL from environment or request
      const baseUrl = process.env.BASE_URL || 
        `${req.protocol}://${req.get("host")}`;

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/pricing?canceled=true`,
        metadata: {
          userId: userId,
          planType: planType,
        },
        subscription_data: {
          metadata: {
            userId: userId,
            planType: planType,
          },
        },
      });

      (res as any).json({ sessionId: session.id, url: session.url });
      return;
    } catch (error) {
      console.error("[Stripe] Checkout error:", error);
      (res as any).status(500).json({ 
        error: "Failed to create checkout session",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * Stripe Webhook Handler
   * POST /api/stripe/webhook
   * Handles: checkout.session.completed, customer.subscription.updated, invoice.payment_failed
   */
  (app as any).post("/api/stripe/webhook", async (req: Request, res: Response) => {
    const reqAny = req as any;
    const sig = reqAny.headers?.["stripe-signature"];

    if (!sig) {
      (res as any).status(400).json({ error: "Missing stripe-signature header" });
      return;
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[Stripe] Missing STRIPE_WEBHOOK_SECRET");
      (res as any).status(500).json({ error: "Webhook secret not configured" });
      return;
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        reqAny.body,
        sig,
        webhookSecret
      );
    } catch (err) {
      console.error("[Stripe] Webhook signature verification failed:", err);
      (res as any).status(400).json({ error: "Invalid signature" });
      return;
    }

    try {
      // Handle different event types
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;
          const planType = session.metadata?.planType as "pro" | "business" | undefined;

          if (!userId || !planType) {
            console.error("[Stripe] Missing userId or planType in checkout session metadata");
            break;
          }

          // Get subscription details
          if (session.subscription) {
            const subscription = await stripe.subscriptions.retrieve(
              session.subscription as string
            );

            await updateUserSubscription(userId, {
              subscriptionStatus: subscription.status === "active" || subscription.status === "trialing" 
                ? subscription.status 
                : "active",
              planType: planType,
            });

            console.log(`[Stripe] Subscription activated for user ${userId}, plan: ${planType}`);
          }

          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata?.userId;
          const planType = subscription.metadata?.planType as "pro" | "business" | undefined;

          if (!userId || !planType) {
            console.error("[Stripe] Missing userId or planType in subscription metadata");
            break;
          }

          // Map Stripe subscription status to our enum
          let subscriptionStatus: "active" | "trialing" | "canceled" | "past_due" = "active";
          
          if (subscription.status === "active") {
            subscriptionStatus = "active";
          } else if (subscription.status === "trialing") {
            subscriptionStatus = "trialing";
          } else if (subscription.status === "canceled" || subscription.status === "unpaid") {
            subscriptionStatus = "canceled";
          } else if (subscription.status === "past_due" || subscription.status === "incomplete_expired") {
            subscriptionStatus = "past_due";
          }

          await updateUserSubscription(userId, {
            subscriptionStatus: subscriptionStatus,
            planType: planType,
          });

          console.log(`[Stripe] Subscription updated for user ${userId}, status: ${subscriptionStatus}`);
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata?.userId;

          if (!userId) {
            console.error("[Stripe] Missing userId in subscription metadata");
            break;
          }

          // Downgrade to free plan when subscription is canceled
          await updateUserSubscription(userId, {
            subscriptionStatus: "canceled",
            planType: "free",
          });

          console.log(`[Stripe] Subscription canceled for user ${userId}, downgraded to free`);
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = invoice.customer as string;

          // Get user by Stripe customer ID
          const db = await import("../db").then(m => m.getDb());
          if (!db) {
            console.error("[Stripe] Database not available");
            break;
          }

          const { users } = await import("../../drizzle/schema");
          const { eq } = await import("drizzle-orm");

          const userResult = await db
            .select()
            .from(users)
            .where(eq(users.stripeCustomerId, customerId))
            .limit(1);

          if (userResult.length === 0) {
            console.error(`[Stripe] User not found for customer ID: ${customerId}`);
            break;
          }

          const userId = userResult[0].id;

          await updateUserSubscription(userId, {
            subscriptionStatus: "past_due",
          });

          console.log(`[Stripe] Payment failed for user ${userId}`);
          break;
        }

        default:
          console.log(`[Stripe] Unhandled event type: ${event.type}`);
      }

      (res as any).json({ received: true });
      return;
    } catch (error) {
      console.error("[Stripe] Webhook handler error:", error);
      (res as any).status(500).json({ 
        error: "Webhook handler failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * Create Stripe Customer Portal Session
   * POST /api/stripe/portal
   * Body: { userId: string }
   */
  (app as any).post("/api/stripe/portal", async (req: Request, res: Response) => {
    try {
      const reqAny = req as any;
      const { userId } = reqAny.body || {};

      if (!userId) {
        (res as any).status(400).json({ error: "userId is required" });
        return;
      }

      const user = await getUser(userId);
      if (!user) {
        (res as any).status(404).json({ error: "User not found" });
        return;
      }

      if (!user.stripeCustomerId) {
        (res as any).status(400).json({ 
          error: "No active subscription found. Please subscribe first." 
        });
        return;
      }

      // Get base URL from environment or request
      const baseUrl = process.env.BASE_URL || 
        `${reqAny.protocol || "https"}://${reqAny.get ? reqAny.get("host") : reqAny.headers?.host || "localhost:3000"}`;

      // Create portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${baseUrl}/settings`,
      });

      (res as any).json({ url: session.url });
      return;
    } catch (error) {
      console.error("[Stripe] Portal error:", error);
      (res as any).status(500).json({ 
        error: "Failed to create portal session",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}


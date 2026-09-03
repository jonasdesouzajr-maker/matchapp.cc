// ============================================================
// MatchApp — stripe-webhook Edge Function
// ------------------------------------------------------------
// Grants and revokes paid tiers automatically when Stripe tells us
// a payment succeeded, a subscription renewed, or a subscription
// ended. Replaces flipping is_vip / is_business by hand in the
// Supabase table editor.
//
// SECURITY — READ THIS BEFORE CHANGING ANYTHING
// This endpoint MUST be deployed with JWT verification disabled
// (Stripe can't send a Supabase JWT), which means the URL is
// publicly reachable. The ONLY thing standing between that URL and
// anyone granting themselves a lifetime Business plan is the Stripe
// signature check below. Never remove it, never "temporarily" skip
// it to debug, and never trust any field in the body before
// constructEventAsync() has returned successfully.
//
// Note we use constructEventAsync + SubtleCryptoProvider rather than
// the synchronous constructEvent: the sync version relies on Node's
// crypto module, which doesn't exist in the Deno edge runtime, and
// fails at runtime rather than at deploy time.
// ============================================================

import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2025-01-27.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

// Async-capable crypto provider — required in Deno.
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  // Service role: needed because the billing columns are deliberately not
  // writable by anon/authenticated (see migration 003). This key must only
  // ever live in Edge Function secrets, never in client code.
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

type PlanKey = "ad_free" | "vip_monthly" | "vip_annual" | "business";

// What each plan actually unlocks on the profile row.
const PLAN_GRANTS: Record<PlanKey, Record<string, boolean>> = {
  ad_free:     { is_ad_free: true },
  vip_monthly: { is_vip: true, is_ad_free: true },
  vip_annual:  { is_vip: true, is_ad_free: true },
  business:    { is_business: true, is_vip: true, is_ad_free: true },
};

// Identify the plan from the amount paid (in cents) plus the checkout mode.
// Amounts are unambiguous across MatchApp's current price list. If prices
// ever change, update this map in the same commit as the Stripe change.
function planFromAmount(amountTotal: number | null, mode: string | null): PlanKey | null {
  if (amountTotal == null) return null;
  if (mode === "payment" && amountTotal === 199) return "ad_free";
  if (mode === "subscription") {
    if (amountTotal === 499) return "vip_monthly";
    if (amountTotal === 3999) return "vip_annual";
    if (amountTotal === 4900) return "business";
  }
  // Fall back to amount alone, in case mode is absent on an older event shape.
  if (amountTotal === 199) return "ad_free";
  if (amountTotal === 499) return "vip_monthly";
  if (amountTotal === 3999) return "vip_annual";
  if (amountTotal === 4900) return "business";
  return null;
}

function log(...args: unknown[]) {
  console.log(`[stripe-webhook]`, ...args);
}

// Idempotency: Stripe retries deliveries, and a retry must not re-apply.
// The events table's primary key does the work — a duplicate insert fails,
// and we treat that failure as "already handled, nothing to do".
async function alreadyProcessed(eventId: string): Promise<boolean> {
  const { data } = await supabase
    .from("stripe_events").select("id").eq("id", eventId).maybeSingle();
  return !!data;
}

async function recordEvent(eventId: string, type: string, userId: string | null, plan: string | null) {
  const { error } = await supabase.from("stripe_events")
    .insert({ id: eventId, type, user_id: userId, plan });
  if (error) log("Could not record event (non-fatal):", error.message);
}

async function grantPlan(userId: string, plan: PlanKey, extra: Record<string, unknown>) {
  const patch = { ...PLAN_GRANTS[plan], ...extra, subscription_updated_at: new Date().toISOString() };
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) throw new Error(`Failed to grant ${plan} to ${userId}: ${error.message}`);
  log(`Granted ${plan} to user ${userId}`);
}

// Revoke recurring entitlements when a subscription ends. Deliberately does
// NOT clear is_ad_free: the $1.99 Ad-Free Pass is a one-time purchase and a
// separate, lapsed subscription must never take it away.
async function revokeSubscription(stripeCustomerId: string, status: string) {
  const { data: profile } = await supabase
    .from("profiles").select("id, subscription_plan")
    .eq("stripe_customer_id", stripeCustomerId).maybeSingle();

  if (!profile) { log(`No profile for customer ${stripeCustomerId}; nothing to revoke`); return null; }

  const { error } = await supabase.from("profiles").update({
    is_vip: false,
    is_business: false,
    subscription_status: status,
    stripe_subscription_id: null,
    subscription_plan: null,
    subscription_updated_at: new Date().toISOString(),
  }).eq("id", profile.id);

  if (error) throw new Error(`Failed to revoke for ${profile.id}: ${error.message}`);
  log(`Revoked subscription tiers for user ${profile.id} (status: ${status})`);
  return profile.id as string;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    log("Missing signature header or STRIPE_WEBHOOK_SECRET");
    return new Response(JSON.stringify({ error: "Not configured" }), { status: 400 });
  }

  // Raw body is required — parsing it first would break signature verification.
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body, signature, webhookSecret, undefined, cryptoProvider,
    );
  } catch (err) {
    // A failure here means the request did not genuinely come from Stripe.
    log("SIGNATURE VERIFICATION FAILED:", err instanceof Error ? err.message : String(err));
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
  }

  // From this point the payload is trusted.
  try {
    if (await alreadyProcessed(event.id)) {
      log(`Event ${event.id} already processed — skipping (Stripe retry)`);
      return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;

        if (!userId) {
          // This is the failure mode to watch for: it means "Client reference
          // ID" isn't enabled on the Payment Link, so we can't tell who paid.
          log(`No client_reference_id on session ${session.id} — cannot identify the user. ` +
              `Enable "Client reference ID" on the Stripe Payment Link.`);
          await recordEvent(event.id, event.type, null, null);
          break;
        }

        const plan = planFromAmount(session.amount_total, session.mode);
        if (!plan) {
          log(`Unrecognised amount ${session.amount_total} (mode ${session.mode}) on session ${session.id}`);
          await recordEvent(event.id, event.type, userId, null);
          break;
        }

        await grantPlan(userId, plan, {
          stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
          stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : null,
          subscription_status: session.mode === "subscription" ? "active" : "one_time",
          subscription_plan: plan,
        });
        await recordEvent(event.id, event.type, userId, plan);
        break;
      }

      // Renewal succeeded — keep the entitlement alive and refresh status.
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
        if (customerId) {
          const { data: profile } = await supabase
            .from("profiles").select("id").eq("stripe_customer_id", customerId).maybeSingle();
          if (profile) {
            await supabase.from("profiles").update({
              subscription_status: "active",
              subscription_updated_at: new Date().toISOString(),
            }).eq("id", profile.id);
            log(`Renewal confirmed for user ${profile.id}`);
            await recordEvent(event.id, event.type, profile.id as string, null);
            break;
          }
        }
        await recordEvent(event.id, event.type, null, null);
        break;
      }

      // Subscription ended or lapsed — revoke the recurring tiers.
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : null;
        const uid = customerId ? await revokeSubscription(customerId, "canceled") : null;
        await recordEvent(event.id, event.type, uid, null);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : null;
        // Only revoke on genuinely dead states. past_due keeps access during
        // Stripe's retry window, so a card blip doesn't lock out a paying user.
        const dead = ["canceled", "unpaid", "incomplete_expired"];
        if (customerId && dead.includes(sub.status)) {
          const uid = await revokeSubscription(customerId, sub.status);
          await recordEvent(event.id, event.type, uid, null);
        } else if (customerId) {
          const { data: profile } = await supabase
            .from("profiles").select("id").eq("stripe_customer_id", customerId).maybeSingle();
          if (profile) {
            await supabase.from("profiles").update({
              subscription_status: sub.status,
              subscription_updated_at: new Date().toISOString(),
            }).eq("id", profile.id);
          }
          await recordEvent(event.id, event.type, profile?.id ?? null, null);
        }
        break;
      }

      default:
        log(`Unhandled event type: ${event.type}`);
        await recordEvent(event.id, event.type, null, null);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    // Return 500 so Stripe retries — better than silently losing a payment.
    const msg = err instanceof Error ? err.message : String(err);
    log("Handler error:", msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
});

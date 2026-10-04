/**
 * weekend-bonus-3pay-webhook — isolated Stripe webhook for the 3-payment plan.
 *
 * Handles: checkout.session.completed
 * Target price: price_1UMLtpBdz48jmuogvEGx8RI8 ($69/month, 3 payments total)
 *
 * Behavior:
 *   - Verifies Stripe webhook signature with a dedicated secret.
 *   - Ignores every price except the target 3-pay price.
 *   - Converts the new subscription into a Stripe Subscription Schedule.
 *   - The schedule lasts exactly 3 billing periods total (checkout + 2 more).
 *   - end_behavior = cancel so the subscription dies after the 3rd payment.
 *   - Idempotent: repeated webhook deliveries do not create duplicate schedules.
 *
 * Security:
 *   - verify_jwt must be false for this function in supabase/config.toml.
 *   - Security is enforced solely through Stripe webhook signature verification.
 *
 * Deployment:
 *   supabase functions deploy weekend-bonus-3pay-webhook
 */

import Stripe from "npm:stripe";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const TARGET_PRICE_ID = "price_1UMLtpBdz48jmuogvEGx8RI8";
const SCHEDULE_PHASE_DURATION = "2 months"; // 2 MORE payments after checkout (total 3)
const END_BEHAVIOR = "cancel";
const PAYMENT_PLAN_METADATA: Record<string, string> = {
  payment_plan: "weekend_bonus_3pay",
  installment_count: "3",
  installment_amount: "69",
  source: "weekend_bonus_bonanza",
};

const WEBHOOK_SECRET = Deno.env.get("STRIPE_3PAY_WEBHOOK_SECRET") || "";
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "content-type, stripe-signature, authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json",
    },
  });
}

function getStripeInstance(): Stripe {
  if (!STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured in Supabase secrets.");
  }
  return new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2026-08-26.dahlia",
  });
}

/**
 * Extract the target price ID from a Checkout Session's line items.
 * Returns the price ID if found, empty string otherwise.
 */
function extractTargetPriceId(
  session: Stripe.Checkout.Session
): string {
  const lineItems = session.line_items?.data || [];
  for (const item of lineItems) {
    const priceId = item.price?.id;
    if (priceId === TARGET_PRICE_ID) {
      return priceId;
    }
  }
  return "";
}

/**
 * Check if a subscription already has a schedule attached.
 * Returns the schedule ID if found, empty string otherwise.
 */
async function findExistingSchedule(
  stripe: Stripe,
  subscriptionId: string
): Promise<string> {
  try {
    const schedules = await stripe.subscriptionSchedules.list({
      subscription: subscriptionId,
      limit: 1,
    });
    if (schedules.data.length > 0) {
      return schedules.data[0].id;
    }
  } catch (err) {
    console.error(
      `[3pay-webhook] failed to list schedules for subscription ${subscriptionId}:`,
      err instanceof Error ? err.message : err
    );
  }
  return "";
}

/**
 * Verify that an existing schedule is correctly configured for the 3-pay plan.
 * Returns true if the schedule matches expectations, false otherwise.
 */
async function verifyScheduleConfiguration(
  stripe: Stripe,
  scheduleId: string
): Promise<boolean> {
  try {
    const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId, {
      expand: ["phases.items"],
    });

    const metadata = schedule.metadata || {};
    const isCorrectPlan =
      metadata.payment_plan === PAYMENT_PLAN_METADATA.payment_plan;
    const isCorrectEndBehavior = schedule.end_behavior === END_BEHAVIOR;

    // Check that the schedule references the target price
    let hasTargetPrice = false;
    for (const phase of schedule.phases.data || []) {
      for (const item of phase.items || []) {
        if (item.price?.id === TARGET_PRICE_ID) {
          hasTargetPrice = true;
          break;
        }
      }
    }

    return isCorrectPlan && isCorrectEndBehavior && hasTargetPrice;
  } catch (err) {
    console.error(
      `[3pay-webhook] failed to verify schedule ${scheduleId}:`,
      err instanceof Error ? err.message : err
    );
    return false;
  }
}

/**
 * Create a Subscription Schedule from an existing subscription.
 * The schedule will bill exactly 2 MORE times (total 3 payments including checkout).
 */
async function create3PaySchedule(
  stripe: Stripe,
  subscriptionId: string
): Promise<Stripe.SubscriptionSchedule> {
  const schedule = await stripe.subscriptionSchedules.create({
    from_subscription: subscriptionId,
    end_behavior: END_BEHAVIOR,
    phases: [
      {
        items: [
          {
            price: TARGET_PRICE_ID,
            quantity: 1,
          },
        ],
        // Use the modern duration field instead of deprecated iterations.
        // This configures the schedule for 2 MORE billing periods.
        // Combined with the already-paid checkout period, the customer
        // receives exactly 3 total $69 charges.
        duration: SCHEDULE_PHASE_DURATION,
      },
    ],
    metadata: {
      ...PAYMENT_PLAN_METADATA,
      source_subscription_id: subscriptionId,
    },
  });

  return schedule;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // -----------------------------------------------------------------------
  // 1. Configuration sanity
  // -----------------------------------------------------------------------
  if (!WEBHOOK_SECRET) {
    console.error(
      "[3pay-webhook] STRIPE_3PAY_WEBHOOK_SECRET is not configured."
    );
    return jsonResponse(
      { error: "Webhook secret not configured" },
      500
    );
  }

  if (!STRIPE_SECRET_KEY) {
    console.error("[3pay-webhook] STRIPE_SECRET_KEY is not configured.");
    return jsonResponse(
      { error: "Stripe secret key not configured" },
      500
    );
  }

  const stripe = getStripeInstance();

  // -----------------------------------------------------------------------
  // 2. Verify webhook signature
  // -----------------------------------------------------------------------
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") || "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error(
      `[3pay-webhook] signature verification failed: ${err.message}`
    );
    return jsonResponse({ error: "Invalid signature" }, 400);
  }

  // -----------------------------------------------------------------------
  // 3. We only care about checkout.session.completed
  // -----------------------------------------------------------------------
  if (event.type !== "checkout.session.completed") {
    // Acknowledge unrelated events without processing them.
    console.log(
      `[3pay-webhook] ignored event type: ${event.type} (id: ${event.id})`
    );
    return jsonResponse({ received: true, ignored: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // -----------------------------------------------------------------------
  // 4. Confirm the session has a subscription
  // -----------------------------------------------------------------------
  const subscriptionId = session.subscription as string | undefined;
  if (!subscriptionId) {
    console.warn(
      `[3pay-webhook] checkout session ${session.id} has no subscription.`
    );
    return jsonResponse({ received: true, error: "No subscription" }, 200);
  }

  // -----------------------------------------------------------------------
  // 5. Confirm the target price is in this checkout
  // -----------------------------------------------------------------------
  const priceId = extractTargetPriceId(session);
  if (!priceId) {
    console.log(
      `[3pay-webhook] ignored session ${session.id}: target price ${TARGET_PRICE_ID} not found in line items.`
    );
    return jsonResponse({ received: true, ignored: true });
  }

  console.log(
    `[3pay-webhook] processing target price checkout: session=${session.id} subscription=${subscriptionId}`
  );

  // -----------------------------------------------------------------------
  // 6. Idempotency: check if a schedule already exists for this subscription
  // -----------------------------------------------------------------------
  const existingScheduleId = await findExistingSchedule(stripe, subscriptionId);

  if (existingScheduleId) {
    const isCorrect = await verifyScheduleConfiguration(
      stripe,
      existingScheduleId
    );
    if (isCorrect) {
      console.log(
        `[3pay-webhook] schedule ${existingScheduleId} already exists and is correctly configured for subscription ${subscriptionId}. Skipping.`
      );
      return jsonResponse({
        received: true,
        schedule_id: existingScheduleId,
        status: "already_configured",
      });
    } else {
      console.warn(
        `[3pay-webhook] schedule ${existingScheduleId} exists but is NOT correctly configured. Manual review required for subscription ${subscriptionId}.`
      );
      // We do not modify existing schedules to avoid unexpected billing changes.
      return jsonResponse({
        received: true,
        schedule_id: existingScheduleId,
        status: "misconfigured",
        error: "Existing schedule does not match 3-pay plan configuration.",
      });
    }
  }

  // -----------------------------------------------------------------------
  // 7. Create the Subscription Schedule
  // -----------------------------------------------------------------------
  try {
    const schedule = await create3PaySchedule(stripe, subscriptionId);

    console.log(
      `[3pay-webhook] created schedule ${schedule.id} for subscription ${subscriptionId}. ` +
        `end_behavior=${schedule.end_behavior} duration=${SCHEDULE_PHASE_DURATION}`
    );

    return jsonResponse({
      received: true,
      schedule_id: schedule.id,
      status: "created",
      subscription_id: subscriptionId,
      end_behavior: schedule.end_behavior,
      phase_duration: SCHEDULE_PHASE_DURATION,
      metadata: schedule.metadata,
    });
  } catch (err: any) {
    console.error(
      `[3pay-webhook] failed to create schedule for subscription ${subscriptionId}:`,
      err.message || err
    );
    return jsonResponse(
      {
        received: true,
        error: `Failed to create subscription schedule: ${err.message || err}`,
      },
      500
    );
  }
});

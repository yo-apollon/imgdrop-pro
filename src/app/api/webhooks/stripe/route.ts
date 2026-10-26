import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook não configurado." },
      { status: 500 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Assinatura do webhook ausente." },
      { status: 400 }
    );
  }

  let event: any;

  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Falha na verificação de assinatura: ${err.message}` },
      { status: 400 }
    );
  }

  const supabase = createAdminSupabaseClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId =
          session.client_reference_id || session.metadata?.userId;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (userId && supabase) {
          const { error } = await supabase
            .from("profiles")
            .update({
              plan: "pro",
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status: "active",
            })
            .eq("id", userId);

          if (error) {
            console.error("Failed to update profile to PRO:", error);
          } else {
            console.log(`User ${userId} successfully upgraded to PRO!`);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        if (supabase) {
          const { error } = await supabase
            .from("profiles")
            .update({
              plan: "free",
              subscription_status: "canceled",
            })
            .eq("stripe_customer_id", customerId);

          if (error) {
            console.error("Failed to downgrade profile to FREE:", error);
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;

        if (supabase) {
          await supabase
            .from("profiles")
            .update({
              plan: "pro",
              subscription_status: "active",
            })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      default:
        // Ignore unhandled event types
        break;
    }

    return NextResponse.json({ received: true });
  } catch (handlerErr: any) {
    console.error("Error processing webhook event:", handlerErr);
    return NextResponse.json(
      { error: "Erro interno no processamento do webhook" },
      { status: 500 }
    );
  }
}

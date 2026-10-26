import { NextRequest, NextResponse } from "next/server";
import { getStripeClient, PLANS } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      billingCycle = "monthly",
      currency = "brl",
      userId,
      userEmail,
    } = body;

    const stripe = getStripeClient();

    // If Stripe is not configured yet, provide clear instruction
    if (!stripe) {
      return NextResponse.json(
        {
          error:
            "Stripe não configurado. Adicione a variável STRIPE_SECRET_KEY nas Environment Variables da Vercel para pagamentos reais.",
          isConfigured: false,
        },
        { status: 400 }
      );
    }

    const host =
      req.headers.get("x-forwarded-host") ||
      req.headers.get("host") ||
      "imgdrop-pro.vercel.app";
    const proto =
      req.headers.get("x-forwarded-proto") ||
      (host.startsWith("localhost") ? "http" : "https");
    const baseUrl = `${proto}://${host}`;

    const plan = billingCycle === "yearly" ? PLANS.yearly : PLANS.monthly;
    const isBRL = currency.toLowerCase() === "brl";

    const unitAmount = isBRL ? plan.priceBRL : plan.priceUSD;
    const interval = billingCycle === "yearly" ? "year" : "month";

    // Use pre-configured priceId if available, otherwise generate dynamic price_data
    const lineItem = plan.priceId
      ? { price: plan.priceId, quantity: 1 }
      : {
          price_data: {
            currency: isBRL ? "brl" : "usd",
            product_data: {
              name: plan.name,
              description:
                "Plano PRO ImgDrop: Uploads de até 50MB, links permanentes e sem limites de expiração.",
              images: [`${baseUrl}/og-image.png`],
            },
            unit_amount: unitAmount,
            recurring: {
              interval: interval as "month" | "year",
            },
          },
          quantity: 1,
        };

    // Build Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [lineItem],
      client_reference_id: userId || undefined,
      customer_email: userEmail || undefined,
      metadata: {
        userId: userId || "",
        billingCycle,
      },
      subscription_data: {
        metadata: {
          userId: userId || "",
          billingCycle,
        },
      },
      success_url: `${baseUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?checkout=cancelled`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error("Stripe checkout session error:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao gerar checkout da Stripe." },
      { status: 500 }
    );
  }
}

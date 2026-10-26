import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe não configurado." },
        { status: 400 }
      );
    }

    const body = await req.json();
    let customerId = body.customerId;
    const userId = body.userId;

    if (!customerId && userId) {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("stripe_customer_id")
          .eq("id", userId)
          .single();

        customerId = profile?.stripe_customer_id;
      }
    }

    if (!customerId) {
      return NextResponse.json(
        { error: "Cliente Stripe não localizado para este usuário." },
        { status: 404 }
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

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error("Stripe customer portal error:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao abrir portal da assinatura." },
      { status: 500 }
    );
  }
}

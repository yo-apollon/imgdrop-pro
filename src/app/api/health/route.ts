import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();

  const healthData = {
    status: "healthy",
    service: "ImgDrop Pro API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "production",
    checks: {
      vercelBlob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      stripe: Boolean(process.env.STRIPE_SECRET_KEY),
      supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    },
    latencyMs: Date.now() - startTime,
    uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
  };

  return NextResponse.json(healthData, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

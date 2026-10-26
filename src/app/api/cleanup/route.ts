import { NextResponse } from "next/server";
import { cleanExpiredImages } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = cleanExpiredImages();
  return NextResponse.json({
    success: true,
    message: `Limpeza executada. ${result.cleanedCount} imagens expiradas removidas.`,
    ...result,
  });
}

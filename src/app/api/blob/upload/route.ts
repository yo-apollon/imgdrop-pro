import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { cleanExpiredImages } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const tokenKey = Object.keys(process.env).find((k) => k.endsWith("READ_WRITE_TOKEN"));
  const hasToken = !!(process.env.BLOB_READ_WRITE_TOKEN || tokenKey);
  const hasOidc = !!process.env.VERCEL_OIDC_TOKEN;
  const storeId = process.env.BLOB_STORE_ID ? "configured" : null;

  return NextResponse.json({
    status: hasToken || hasOidc ? "connected" : "missing_token",
    hasToken,
    tokenKey: tokenKey || (process.env.BLOB_READ_WRITE_TOKEN ? "BLOB_READ_WRITE_TOKEN" : null),
    hasOidc,
    storeId,
    message: hasToken || hasOidc
      ? "Vercel Blob está configurado corretamente."
      : "Vercel Blob não conectado. Vincule o Blob Store ao projeto na aba Storage da Vercel.",
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 });
  }

  try {
    cleanExpiredImages();

    const token =
      process.env.BLOB_READ_WRITE_TOKEN ||
      (Object.keys(process.env).find((k) => k.endsWith("READ_WRITE_TOKEN"))
        ? process.env[Object.keys(process.env).find((k) => k.endsWith("READ_WRITE_TOKEN"))!]
        : undefined);

    if (!token && !process.env.VERCEL_OIDC_TOKEN) {
      return NextResponse.json(
        {
          error:
            "BLOB_READ_WRITE_TOKEN não configurado. No painel da Vercel, acesse Storage -> imgdrop-pro-blob -> Connect Project -> imgdrop-pro.",
        },
        { status: 400 }
      );
    }

    const jsonResponse = await handleUpload({
      body,
      request,
      ...(token ? { token } : {}),
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/svg+xml",
            "image/avif",
            "image/x-icon",
            "image/bmp",
          ],
          maximumSizeInBytes: 50 * 1024 * 1024, // 50MB
          tokenPayload: JSON.stringify({ pathname }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // Direct upload completed
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    console.error("Blob upload handler error:", error);
    return NextResponse.json(
      { error: error?.message || "Erro no upload do Vercel Blob" },
      { status: 400 }
    );
  }
}

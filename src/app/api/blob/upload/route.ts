import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { cleanExpiredImages } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    cleanExpiredImages();

    // Look for any Vercel Blob token (standard BLOB_READ_WRITE_TOKEN or any prefixed one)
    const tokenKey = Object.keys(process.env).find((k) => k.endsWith("READ_WRITE_TOKEN"));
    const blobToken = tokenKey ? process.env[tokenKey] : undefined;

    if (!blobToken) {
      return NextResponse.json(
        {
          error:
            "Vercel Blob token não encontrado nas variáveis de ambiente. Verifique em Settings -> Environment Variables na Vercel.",
        },
        { status: 503 }
      );
    }

    const jsonResponse = await handleUpload({
      body,
      request,
      token: blobToken,
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
        // Upload finished directly to Vercel CDN
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

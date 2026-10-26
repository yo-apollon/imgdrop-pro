import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getCachedBuffer } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Security: Prevent path traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return new NextResponse("Arquivo inválido", { status: 400 });
    }

    let fileBuffer: Buffer | null = getCachedBuffer(filename);

    if (!fileBuffer) {
      const pathsToCheck = [
        path.join("/tmp", "uploads", filename),
        path.join(process.cwd(), "public", "uploads", filename),
      ];

      for (const p of pathsToCheck) {
        if (fs.existsSync(p)) {
          try {
            fileBuffer = fs.readFileSync(p);
            break;
          } catch {}
        }
      }
    }

    if (!fileBuffer) {
      return new NextResponse("Imagem não encontrada", { status: 404 });
    }
    const ext = path.extname(filename).toLowerCase().replace(".", "");

    let contentType = "application/octet-stream";
    switch (ext) {
      case "webp":
        contentType = "image/webp";
        break;
      case "png":
        contentType = "image/png";
        break;
      case "jpg":
      case "jpeg":
        contentType = "image/jpeg";
        break;
      case "gif":
        contentType = "image/gif";
        break;
      case "svg":
        contentType = "image/svg+xml";
        break;
      case "avif":
        contentType = "image/avif";
        break;
      case "ico":
        contentType = "image/x-icon";
        break;
    }

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    };

    // Stored XSS defense for SVG
    if (contentType === "image/svg+xml") {
      headers["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers,
    });
  } catch (error: any) {
    return new NextResponse(error?.message || "Erro interno", { status: 500 });
  }
}

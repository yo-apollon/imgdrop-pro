import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { processImage } from "@/lib/imageProcessor";
import { saveUploadedFile, cleanExpiredImages, getActiveStorageProvider } from "@/lib/storage";
import { calculateExpirationDate } from "@/lib/utils";
import { sanitizeSvg, checkRateLimit } from "@/lib/security";
import { ExpirationOption, OutputFormat } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting by IP
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const { allowed, remaining } = checkRateLimit(clientIp, 60, 10 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Limite de requisições excedido. Tente novamente em alguns minutos." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    // Opportunistically clean expired images
    cleanExpiredImages();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado." },
        { status: 400 }
      );
    }

    // Options from form
    const expiration = (formData.get("expiration") as ExpirationOption) || "never";
    const outputFormat = (formData.get("outputFormat") as OutputFormat) || "original";
    const stripExif = formData.get("stripExif") !== "false";
    const maxDimensionStr = formData.get("maxDimension") as string | null;
    const maxDimension = maxDimensionStr ? parseInt(maxDimensionStr, 10) : undefined;
    const qualityStr = formData.get("quality") as string | null;
    const quality = qualityStr ? parseInt(qualityStr, 10) : 85;
    const userId = (formData.get("userId") as string | null) || undefined;

    // Check size limit: 32MB max
    if (file.size > 32 * 1024 * 1024) {
      return NextResponse.json(
        { error: "O tamanho do arquivo excede o limite de 32MB." },
        { status: 413 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    let inputBuffer = Buffer.from(arrayBuffer);

    // 2. SVG Sanitization (Prevent Stored XSS)
    if (file.type.includes("svg") || file.name.endsWith(".svg")) {
      const rawSvg = inputBuffer.toString("utf-8");
      const cleanSvg = sanitizeSvg(rawSvg);
      inputBuffer = Buffer.from(cleanSvg, "utf-8");
    }

    // Process image with Sharp
    const processed = await processImage(inputBuffer, {
      stripExif,
      outputFormat,
      quality,
      maxDimension,
    });

    const id = nanoid(8);
    const deleteToken = nanoid(24);
    const nowIso = new Date().toISOString();
    const expiresAt = calculateExpirationDate(expiration);

    const saved = await saveUploadedFile(id, processed.buffer, processed.extension, {
      id,
      filename: file.name,
      size: processed.size,
      originalSize: file.size,
      mimeType: processed.mimeType,
      width: processed.width,
      height: processed.height,
      createdAt: nowIso,
      expiresAt,
      deleteToken,
      userId,
    });

    // Determine host origin for absolute URLs
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
    const baseUrl = `${proto}://${host}`;

    // If cloud storage returned a full URL, use it; otherwise prepend baseUrl
    const fullUrl = saved.url.startsWith("http") ? saved.url : `${baseUrl}${saved.url}`;
    const fullViewUrl = `${baseUrl}${saved.viewUrl}`;

    return NextResponse.json(
      {
        success: true,
        image: {
          ...saved,
          url: fullUrl,
          viewUrl: fullViewUrl,
          relativeUrl: saved.url,
        },
        markdown: `![${file.name}](${fullUrl})`,
        html: `<img src="${fullUrl}" alt="${file.name}" />`,
        bbcode: `[img]${fullUrl}[/img]`,
      },
      {
        headers: {
          "X-RateLimit-Remaining": String(remaining),
        },
      }
    );
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Falha no processamento ou envio da imagem." },
      { status: 500 }
    );
  }
}

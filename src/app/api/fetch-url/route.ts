import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { processImage } from "@/lib/imageProcessor";
import { saveUploadedFile, cleanExpiredImages } from "@/lib/storage";
import { calculateExpirationDate } from "@/lib/utils";
import { sanitizeSvg, isSafeRemoteUrl, checkRateLimit } from "@/lib/security";
import { ExpirationOption, OutputFormat } from "@/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const { allowed, remaining } = checkRateLimit(clientIp, 40, 10 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Limite de requisições excedido. Tente novamente mais tarde." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    cleanExpiredImages();

    const body = await req.json();
    const {
      url,
      expiration = "never",
      outputFormat = "original",
      stripExif = true,
      maxDimension,
      quality = 85,
      userId,
    } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL da imagem é obrigatória." },
        { status: 400 }
      );
    }

    // SSRF Validation
    const safetyCheck = isSafeRemoteUrl(url);
    if (!safetyCheck.safe) {
      return NextResponse.json(
        { error: `URL não permitida: ${safetyCheck.reason}` },
        { status: 403 }
      );
    }

    // Fetch the remote image with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ImgDrop/1.0",
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Falha ao baixar imagem: status ${response.status}` },
        { status: 400 }
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (
      !contentType.includes("image") &&
      !contentType.includes("octet-stream") &&
      !contentType.includes("xml")
    ) {
      return NextResponse.json(
        { error: "A URL fornecida não aponta para uma imagem válida." },
        { status: 400 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    let inputBuffer = Buffer.from(arrayBuffer);

    if (inputBuffer.length > 32 * 1024 * 1024) {
      return NextResponse.json(
        { error: "A imagem remota excede o limite de 32MB." },
        { status: 413 }
      );
    }

    // SVG Sanitization
    if (contentType.includes("svg") || url.toLowerCase().includes(".svg")) {
      const rawSvg = inputBuffer.toString("utf-8");
      const cleanSvg = sanitizeSvg(rawSvg);
      inputBuffer = Buffer.from(cleanSvg, "utf-8");
    }

    // Process image with Sharp
    const processed = await processImage(inputBuffer, {
      stripExif,
      outputFormat: outputFormat as OutputFormat,
      quality: quality || 85,
      maxDimension: maxDimension ? parseInt(maxDimension, 10) : undefined,
    });

    const id = nanoid(8);
    const deleteToken = nanoid(24);
    const nowIso = new Date().toISOString();
    const expiresAt = calculateExpirationDate(expiration as ExpirationOption);

    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;
    const rawFilename = pathname.substring(pathname.lastIndexOf("/") + 1) || "imported_image";
    const filename = rawFilename.split("?")[0] || "imported_image";

    const saved = await saveUploadedFile(id, processed.buffer, processed.extension, {
      id,
      filename,
      size: processed.size,
      originalSize: inputBuffer.length,
      mimeType: processed.mimeType,
      width: processed.width,
      height: processed.height,
      createdAt: nowIso,
      expiresAt,
      deleteToken,
      userId,
    });

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
    const baseUrl = `${proto}://${host}`;

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
        markdown: `![${filename}](${fullUrl})`,
        html: `<img src="${fullUrl}" alt="${filename}" />`,
        bbcode: `[img]${fullUrl}[/img]`,
      },
      {
        headers: {
          "X-RateLimit-Remaining": String(remaining),
        },
      }
    );
  } catch (error: any) {
    console.error("Fetch URL error:", error);
    return NextResponse.json(
      { error: error?.message || "Não foi possível importar a imagem da URL informada." },
      { status: 500 }
    );
  }
}

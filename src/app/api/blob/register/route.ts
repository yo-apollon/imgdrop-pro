import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { saveUploadedFile } from "@/lib/storage";
import { calculateExpirationDate } from "@/lib/utils";
import { ExpirationOption } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, filename, size, mimeType, expiration = "never", userId } = body;

    if (!url) {
      return NextResponse.json({ error: "URL é obrigatória" }, { status: 400 });
    }

    const id = nanoid(8);
    const deleteToken = nanoid(24);
    const nowIso = new Date().toISOString();
    const expiresAt = calculateExpirationDate(expiration as ExpirationOption);

    const ext = filename.split(".").pop() || "png";

    const saved = await saveUploadedFile(id, Buffer.from(""), ext, {
      id,
      filename: filename || "imagem",
      size: size || 0,
      originalSize: size || 0,
      mimeType: mimeType || "image/png",
      width: 1920,
      height: 1080,
      createdAt: nowIso,
      expiresAt,
      deleteToken,
      userId,
    });

    // Override url with the direct blob CDN url
    saved.url = url;

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
    const baseUrl = `${proto}://${host}`;
    const fullViewUrl = `${baseUrl}${saved.viewUrl}`;

    return NextResponse.json({
      success: true,
      image: {
        ...saved,
        url,
        viewUrl: fullViewUrl,
      },
      markdown: `![${filename}](${url})`,
      html: `<img src="${url}" alt="${filename}" />`,
      bbcode: `[img]${url}[/img]`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

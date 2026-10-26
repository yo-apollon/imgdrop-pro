import { NextRequest, NextResponse } from "next/server";
import { getMetadataById, deleteImage, cleanExpiredImages } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    cleanExpiredImages();
    const { id } = await params;
    const meta = getMetadataById(id);

    if (!meta) {
      return NextResponse.json(
        { error: "Imagem não encontrada ou expirada." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, image: meta });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const token =
      req.headers.get("x-delete-token") ||
      url.searchParams.get("token") ||
      undefined;

    const deleted = await deleteImage(id, token);

    if (!deleted) {
      return NextResponse.json(
        { error: "Imagem não encontrada ou token de exclusão inválido." },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, message: "Imagem excluída com sucesso." });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

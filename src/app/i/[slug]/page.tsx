import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getMetadataById } from "@/lib/storage";
import { formatBytes, formatDate } from "@/lib/utils";
import { ArrowLeft, Download, ExternalLink, Copy, Check, Clock, Maximize2, ShieldCheck, Sparkles } from "lucide-react";
import CopyActionButtons from "@/components/ui/CopyActionButtons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const image = getMetadataById(slug);

  if (!image) {
    return {
      title: "Imagem não encontrada - ImgDrop Pro",
    };
  }

  return {
    title: `${image.filename} (${image.width}x${image.height}) - ImgDrop Pro`,
    description: `Hospedagem rápida de imagem: ${image.filename} - ${formatBytes(image.size)}`,
    openGraph: {
      images: [image.url],
    },
    twitter: {
      card: "summary_large_image",
      images: [image.url],
    },
  };
}

export default async function ImageViewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const image = getMetadataById(slug);

  if (!image) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-dark-border/60 bg-dark-surface/60 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-dark-muted hover:text-dark-text transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para o Início</span>
        </Link>

        <div className="flex items-center gap-3">
          <a
            href={image.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-dark-card border border-dark-border hover:border-dark-borderSubtle text-dark-text hover:bg-dark-hover transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-brand-cyan" />
            <span>Abrir Arquivo Bruto</span>
          </a>
          <a
            href={image.url}
            download={image.filename}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-emerald hover:bg-brand-emeraldLight text-dark-bg transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar</span>
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Preview Frame */}
        <div className="relative rounded-2xl border border-dark-border/80 bg-dark-surface/80 p-4 sm:p-8 flex flex-col items-center justify-center min-h-[420px] max-h-[75vh] overflow-hidden shadow-2xl">
          {/* Subtle checkerboard background for transparent pngs/svgs */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)`,
              backgroundSize: "24px 24px",
              backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0px",
            }}
          />

          <div className="relative max-h-[65vh] max-w-full flex items-center justify-center z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={image.filename}
              className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-lg border border-dark-border/40"
            />
          </div>

          <div className="absolute bottom-3 right-4 z-20 text-[11px] font-mono text-dark-muted/80 bg-dark-bg/80 backdrop-blur px-2.5 py-1 rounded-md border border-dark-border/50">
            {image.width} × {image.height} px
          </div>
        </div>

        {/* Image Metadata & Copy Hub */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* File details card */}
          <div className="rounded-xl border border-dark-border/70 bg-dark-card/60 p-5 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-dark-text flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-emerald" />
              Detalhes do Arquivo
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-dark-border/40">
                <span className="text-dark-muted">Nome do Arquivo</span>
                <span className="text-dark-text font-medium truncate max-w-[180px]" title={image.filename}>
                  {image.filename}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dark-border/40">
                <span className="text-dark-muted">Dimensões</span>
                <span className="text-dark-text font-mono font-medium">
                  {image.width} × {image.height} px
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dark-border/40">
                <span className="text-dark-muted">Tamanho Otimizado</span>
                <span className="text-dark-text font-mono font-medium">
                  {formatBytes(image.size)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dark-border/40">
                <span className="text-dark-muted">Formato MIME</span>
                <span className="text-dark-text font-mono uppercase bg-dark-surface px-1.5 py-0.5 rounded text-[10px]">
                  {image.mimeType.replace("image/", "")}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dark-border/40">
                <span className="text-dark-muted">Data de Envio</span>
                <span className="text-dark-text">{formatDate(image.createdAt)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-dark-muted flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-brand-amber" />
                  Expiração
                </span>
                <span className="text-dark-text font-medium">
                  {image.expiresAt ? formatDate(image.expiresAt) : "Nunca (Permanente)"}
                </span>
              </div>
            </div>
          </div>

          {/* Copy and embed snippet buttons */}
          <div className="lg:col-span-2 rounded-xl border border-dark-border/70 bg-dark-card/60 p-5 flex flex-col justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-dark-text mb-1">
                Compartilhamento & Códigos de Inserção
              </h2>
              <p className="text-xs text-dark-muted">
                Copie o link direto ou snippet pronto para fóruns, documentações ou sites.
              </p>
            </div>

            <CopyActionButtons
              directUrl={image.url}
              filename={image.filename}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

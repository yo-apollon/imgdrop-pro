"use client";

import React, { useState } from "react";
import { UploadedImageMetadata } from "@/types";
import { formatBytes, copyToClipboard } from "@/lib/utils";
import {
  Copy,
  Check,
  ExternalLink,
  Download,
  Trash2,
  QrCode,
  Link as LinkIcon,
  Code,
  Globe,
  FileCode,
  Hash,
  Eye,
  Percent,
} from "lucide-react";
import QRCode from "qrcode";

interface Props {
  image: UploadedImageMetadata;
  onDelete?: (id: string) => void;
}

export default function ResultCard({ image, onDelete }: Props) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeFormat, setActiveFormat] = useState<"direct" | "markdown" | "html" | "bbcode">("direct");
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Compute savings if original was larger
  const savedBytes = image.originalSize - image.size;
  const savingsPercent =
    image.originalSize > 0 && savedBytes > 0
      ? Math.round((savedBytes / image.originalSize) * 100)
      : 0;

  const formats = {
    direct: image.url,
    markdown: `![${image.filename}](${image.url})`,
    html: `<img src="${image.url}" alt="${image.filename}" />`,
    bbcode: `[img]${image.url}[/img]`,
  };

  const handleCopy = async (key: string, text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const toggleQr = async () => {
    if (!qrDataUrl) {
      try {
        const url = await QRCode.toDataURL(image.url, {
          width: 300,
          margin: 2,
          color: { dark: "#0f172a", light: "#ffffff" },
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error("QR error:", err);
      }
    }
    setShowQr(!showQr);
  };

  return (
    <div className="w-full bg-dark-card/90 border border-dark-border hover:border-dark-borderSubtle rounded-2xl p-4 sm:p-5 shadow-xl transition-all flex flex-col gap-4">
      {/* Top bar: Info and quick actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-dark-border/50">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mini preview thumbnail */}
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-dark-surface border border-dark-border shrink-0 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={image.filename}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="min-w-0 flex flex-col">
            <h4 className="text-sm font-semibold text-dark-text truncate" title={image.filename}>
              {image.filename}
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-dark-muted font-mono">
              <span>{formatBytes(image.size)}</span>
              <span>•</span>
              <span>{image.width}×{image.height}px</span>
              {savingsPercent > 0 && (
                <>
                  <span>•</span>
                  <span className="text-brand-emerald font-semibold flex items-center gap-0.5">
                    <Percent className="w-3 h-3" />
                    -{savingsPercent}% economizado
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <button
            type="button"
            onClick={toggleQr}
            className={`p-2 rounded-lg border transition-colors ${
              showQr
                ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan"
                : "bg-dark-surface border-dark-border hover:bg-dark-hover text-dark-muted hover:text-dark-text"
            }`}
            title="Exibir QR Code"
          >
            <QrCode className="w-4 h-4" />
          </button>

          <a
            href={image.viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-dark-surface border border-dark-border hover:bg-dark-hover text-dark-muted hover:text-dark-text transition-colors"
            title="Página de visualização detalhada"
          >
            <Eye className="w-4 h-4" />
          </a>

          <a
            href={image.url}
            download={image.filename}
            className="p-2 rounded-lg bg-dark-surface border border-dark-border hover:bg-dark-hover text-dark-muted hover:text-dark-text transition-colors"
            title="Baixar imagem"
          >
            <Download className="w-4 h-4" />
          </a>

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(image.id)}
              className="p-2 rounded-lg bg-dark-surface border border-dark-border hover:bg-brand-rose/20 hover:border-brand-rose/40 text-dark-muted hover:text-brand-rose transition-colors"
              title="Excluir imagem"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* QR Code Collapsible Drawer */}
      {showQr && qrDataUrl && (
        <div className="p-4 rounded-xl bg-dark-surface border border-brand-cyan/30 flex flex-col sm:flex-row items-center gap-4 animate-fade-in">
          <div className="bg-white p-2 rounded-lg shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR Code" className="w-24 h-24" />
          </div>
          <div className="flex flex-col gap-1 text-xs">
            <span className="font-semibold text-dark-text">QR Code Direto</span>
            <p className="text-dark-muted text-[11px]">
              Compartilhe facilmente com dispositivos móveis.
            </p>
            <a
              href={qrDataUrl}
              download={`qrcode-${image.id}.png`}
              className="mt-1 inline-flex items-center gap-1.5 text-brand-cyan hover:underline font-mono text-[11px]"
            >
              <Download className="w-3 h-3" /> Baixar Imagem QR (.png)
            </a>
          </div>
        </div>
      )}

      {/* Format Selector Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setActiveFormat("direct")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeFormat === "direct"
              ? "bg-brand-emerald text-dark-bg font-semibold shadow-sm"
              : "bg-dark-surface hover:bg-dark-hover text-dark-muted hover:text-dark-text border border-dark-border"
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          Link Direto
        </button>

        <button
          type="button"
          onClick={() => setActiveFormat("markdown")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeFormat === "markdown"
              ? "bg-brand-emerald text-dark-bg font-semibold shadow-sm"
              : "bg-dark-surface hover:bg-dark-hover text-dark-muted hover:text-dark-text border border-dark-border"
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          Markdown
        </button>

        <button
          type="button"
          onClick={() => setActiveFormat("html")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeFormat === "html"
              ? "bg-brand-emerald text-dark-bg font-semibold shadow-sm"
              : "bg-dark-surface hover:bg-dark-hover text-dark-muted hover:text-dark-text border border-dark-border"
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          HTML &lt;img&gt;
        </button>

        <button
          type="button"
          onClick={() => setActiveFormat("bbcode")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeFormat === "bbcode"
              ? "bg-brand-emerald text-dark-bg font-semibold shadow-sm"
              : "bg-dark-surface hover:bg-dark-hover text-dark-muted hover:text-dark-text border border-dark-border"
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          BBCode
        </button>
      </div>

      {/* Code / URL Display & Copy field */}
      <div className="relative flex items-center">
        <input
          type="text"
          readOnly
          value={formats[activeFormat]}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          className="w-full bg-dark-surface border border-dark-border rounded-xl pl-3.5 pr-24 py-2.5 text-xs font-mono text-dark-text focus:outline-none focus:border-brand-emerald selection:bg-brand-emerald/30 select-all"
        />

        <button
          type="button"
          onClick={() => handleCopy(activeFormat, formats[activeFormat])}
          className={`absolute right-1.5 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            copiedKey === activeFormat
              ? "bg-brand-emerald text-dark-bg font-semibold"
              : "bg-dark-card hover:bg-dark-hover text-dark-text border border-dark-border hover:border-dark-borderSubtle"
          }`}
        >
          {copiedKey === activeFormat ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-brand-emerald" />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

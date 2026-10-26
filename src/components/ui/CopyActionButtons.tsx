"use client";

import React, { useState, useEffect } from "react";
import { Copy, Check, QrCode, Code, Globe, Hash } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import QRCode from "qrcode";

interface Props {
  directUrl: string;
  filename: string;
}

export default function CopyActionButtons({ directUrl, filename }: Props) {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [fullDirectUrl, setFullDirectUrl] = useState(directUrl);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const full = directUrl.startsWith("http")
        ? directUrl
        : `${window.location.origin}${directUrl}`;
      setFullDirectUrl(full);

      QRCode.toDataURL(full, { width: 300, margin: 2, color: { dark: "#0f172a", light: "#ffffff" } })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error("Error generating QR:", err));
    }
  }, [directUrl]);

  const formats = [
    {
      id: "direct",
      label: "Link Direto",
      icon: Globe,
      value: fullDirectUrl,
    },
    {
      id: "markdown",
      label: "Markdown",
      icon: Code,
      value: `![${filename}](${fullDirectUrl})`,
    },
    {
      id: "html",
      label: "HTML",
      icon: Code,
      value: `<img src="${fullDirectUrl}" alt="${filename}" />`,
    },
    {
      id: "bbcode",
      label: "BBCode",
      icon: Hash,
      value: `[img]${fullDirectUrl}[/img]`,
    },
  ];

  const handleCopy = async (id: string, text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedType(id);
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  return (
    <div className="space-y-3">
      {formats.map((fmt) => {
        const Icon = fmt.icon;
        const isCopied = copiedType === fmt.id;

        return (
          <div key={fmt.id} className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-dark-muted font-medium flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-brand-emerald" />
                {fmt.label}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(fmt.id, fmt.value)}
                className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded transition-colors ${
                  isCopied
                    ? "text-brand-emerald bg-brand-emerald/10 font-semibold"
                    : "text-dark-muted hover:text-dark-text"
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copiar
                  </>
                )}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={fmt.value}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="w-full bg-dark-surface/90 border border-dark-border rounded-lg px-3 py-2 text-xs font-mono text-dark-text/90 focus:outline-none focus:border-brand-emerald selection:bg-brand-emerald/30 select-all"
              />
            </div>
          </div>
        );
      })}

      <div className="pt-2 flex items-center justify-between border-t border-dark-border/40">
        <button
          type="button"
          onClick={() => setShowQrModal(true)}
          className="flex items-center gap-1.5 text-xs text-brand-cyan hover:text-brand-cyan/80 font-medium py-1 transition-colors"
        >
          <QrCode className="w-4 h-4" />
          <span>Gerar / Baixar QR Code</span>
        </button>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 max-w-sm w-full flex flex-col items-center gap-4 animate-fade-in shadow-2xl">
            <h3 className="text-sm font-semibold text-dark-text flex items-center gap-2">
              <QrCode className="w-4 h-4 text-brand-cyan" />
              QR Code da Imagem
            </h3>

            {qrCodeDataUrl ? (
              <div className="bg-white p-3 rounded-xl shadow-inner border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCodeDataUrl} alt="QR Code" className="w-48 h-48" />
              </div>
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-xs text-dark-muted">
                Gerando QR Code...
              </div>
            )}

            <p className="text-center text-xs text-dark-muted">
              Aponte a câmera do smartphone para abrir a imagem diretamente no navegador.
            </p>

            <div className="flex gap-2 w-full pt-2">
              {qrCodeDataUrl && (
                <a
                  href={qrCodeDataUrl}
                  download={`qrcode-${filename}.png`}
                  className="flex-1 text-center py-2 px-3 rounded-lg bg-brand-emerald hover:bg-brand-emeraldLight text-dark-bg font-semibold text-xs transition-colors"
                >
                  Baixar QR Code
                </a>
              )}
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="px-4 py-2 rounded-lg bg-dark-surface border border-dark-border hover:bg-dark-hover text-dark-text text-xs font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React from "react";
import { ShieldCheck, Zap, Lock, Globe2 } from "lucide-react";

export default function Footer() {
  const formats = ["PNG", "JPG", "WEBP", "GIF", "AVIF", "SVG", "BMP", "ICO"];

  return (
    <footer className="border-t border-dark-border/60 bg-dark-surface/40 mt-auto py-12 text-xs text-dark-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* Value pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-dark-border/40">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-dark-card border border-dark-border text-brand-emerald">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-dark-text text-sm">CDN & URLs Diretas</h4>
              <p className="text-dark-muted/80 mt-1">
                Gere links permanentes e diretos para imagens sem páginas intermediárias cheias de anúncios.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-dark-card border border-dark-border text-brand-cyan">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-dark-text text-sm">Privacidade & Limpeza EXIF</h4>
              <p className="text-dark-muted/80 mt-1">
                Remoção automática de metadados sensíveis (câmera, lente, localização GPS) para proteger sua identidade.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-dark-card border border-dark-border text-brand-violet">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-dark-text text-sm">Autodestruição Programada</h4>
              <p className="text-dark-muted/80 mt-1">
                Configure expiração automática de 1h, 24h, 7d ou 30 dias se desejar compartilhamentos temporários.
              </p>
            </div>
          </div>
        </div>

        {/* Formats banner */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-dark-dimmed text-[11px] font-medium uppercase tracking-wider">
              Formatos Suportados:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {formats.map((fmt) => (
                <span
                  key={fmt}
                  className="px-2 py-0.5 rounded bg-dark-card border border-dark-border text-[10px] font-mono text-dark-muted"
                >
                  {fmt}
                </span>
              ))}
            </div>
          </div>

          <div className="text-dark-dimmed text-[11px] flex items-center gap-4">
            <span>© {new Date().getFullYear()} ImgDrop Pro. Todos os direitos reservados.</span>
            <span className="text-brand-emerald font-medium">100% Livre de Anúncios</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

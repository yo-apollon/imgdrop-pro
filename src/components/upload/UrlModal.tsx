"use client";

import React, { useState } from "react";
import { Link2, X, Loader2, AlertCircle } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string) => Promise<void>;
}

export default function UrlModal({ isOpen, onClose, onSubmit }: Props) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await onSubmit(url.trim());
      setUrl("");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Não foi possível carregar a imagem da URL.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 max-w-md w-full shadow-2xl relative animate-fade-in">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-dark-muted hover:text-dark-text transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-dark-text">Importar por URL</h3>
            <p className="text-xs text-dark-muted">
              Cole o link de uma imagem da internet para hospedá-la aqui.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1">
            <input
              type="url"
              placeholder="https://exemplo.com/minha-imagem.png"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              autoFocus
              className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-2.5 text-xs text-dark-text placeholder:text-dark-dimmed focus:outline-none focus:border-brand-emerald"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-brand-rose/10 border border-brand-rose/20 text-brand-rose text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-dark-surface border border-dark-border hover:bg-dark-hover text-dark-text text-xs font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-emerald hover:bg-brand-emeraldLight disabled:opacity-50 text-dark-bg text-xs font-semibold transition-all shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importando...</span>
                </>
              ) : (
                <span>Importar & Converter</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

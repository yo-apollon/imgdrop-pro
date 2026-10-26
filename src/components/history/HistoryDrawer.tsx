"use client";

import React, { useState, useEffect } from "react";
import { UploadedImageMetadata } from "@/types";
import { getLocalHistory, removeFromLocalHistory, clearLocalHistory } from "@/lib/historyStore";
import { formatBytes, formatDate, copyToClipboard } from "@/lib/utils";
import {
  X,
  History,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Search,
  HardDrive,
  Clock,
  Sparkles,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function HistoryDrawer({ isOpen, onClose }: Props) {
  const [history, setHistory] = useState<UploadedImageMetadata[]>([]);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      setHistory(getLocalHistory());
    };

    if (isOpen) {
      load();
    }

    window.addEventListener("local-history-updated", load);
    return () => window.removeEventListener("local-history-updated", load);
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = history.filter((item) =>
    item.filename.toLowerCase().includes(search.toLowerCase())
  );

  const totalBytes = history.reduce((acc, curr) => acc + (curr.size || 0), 0);

  const handleCopy = async (id: string, url: string) => {
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleDelete = async (id: string, deleteToken?: string) => {
    // Also call backend delete if deleteToken is available
    if (deleteToken) {
      try {
        await fetch(`/api/images/${id}?token=${deleteToken}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("Backend delete error:", err);
      }
    }
    removeFromLocalHistory(id);
    setHistory((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm flex justify-end animate-fade-in">
      <div className="w-full max-w-md bg-dark-bg border-l border-dark-border h-full flex flex-col shadow-2xl relative animate-slide-up">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-dark-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-dark-text">Histórico Local</h3>
              <p className="text-[11px] text-dark-muted">Salvo no seu navegador</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-dark-muted hover:text-dark-text hover:bg-dark-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats & Search */}
        <div className="p-4 border-b border-dark-border/40 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-dark-muted bg-dark-surface/60 px-3 py-2 rounded-xl border border-dark-border/60">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-emerald" />
              {history.length} {history.length === 1 ? "imagem" : "imagens"}
            </span>
            <span className="flex items-center gap-1.5 font-mono text-dark-text">
              <HardDrive className="w-3.5 h-3.5 text-brand-cyan" />
              {formatBytes(totalBytes)}
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-dark-dimmed" />
            <input
              type="text"
              placeholder="Buscar por nome do arquivo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-dark-surface border border-dark-border rounded-xl pl-9 pr-3 py-2 text-xs text-dark-text placeholder:text-dark-dimmed focus:outline-none focus:border-brand-emerald"
            />
          </div>
        </div>

        {/* History list */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-dark-muted">
              <History className="w-8 h-8 text-dark-dimmed mb-2 stroke-[1.5]" />
              <p className="text-xs font-medium text-dark-text mb-1">
                Nenhum upload recente
              </p>
              <p className="text-[11px] text-dark-dimmed max-w-[200px]">
                As imagens enviadas neste dispositivo aparecerão aqui automaticamente.
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="group p-3 rounded-xl bg-dark-card/60 hover:bg-dark-card border border-dark-border/60 hover:border-dark-border transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-dark-surface border border-dark-border shrink-0 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.filename}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex flex-col">
                    <span
                      className="text-xs font-medium text-dark-text truncate"
                      title={item.filename}
                    >
                      {item.filename}
                    </span>
                    <span className="text-[10px] text-dark-muted font-mono">
                      {formatBytes(item.size)} • {item.width}×{item.height}
                    </span>
                    <span className="text-[10px] text-dark-dimmed flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5 text-brand-amber" />
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(item.id, item.url)}
                    className="p-1.5 rounded-lg bg-dark-surface hover:bg-dark-hover border border-dark-border text-dark-muted hover:text-dark-text transition-colors"
                    title="Copiar URL"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-brand-emerald" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <a
                    href={item.viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-dark-surface hover:bg-dark-hover border border-dark-border text-dark-muted hover:text-dark-text transition-colors"
                    title="Visualizar"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id, item.deleteToken)}
                    className="p-1.5 rounded-lg bg-dark-surface hover:bg-brand-rose/20 border border-dark-border hover:border-brand-rose/40 text-dark-muted hover:text-brand-rose transition-colors"
                    title="Remover do histórico"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer actions */}
        {history.length > 0 && (
          <div className="p-4 border-t border-dark-border/60 bg-dark-surface/40 flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                if (confirm("Deseja realmente limpar todo o histórico local?")) {
                  clearLocalHistory();
                  setHistory([]);
                }
              }}
              className="text-xs text-brand-rose hover:underline font-medium flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Todo o Histórico</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-dark-surface border border-dark-border hover:bg-dark-hover text-dark-text text-xs font-medium transition-colors"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

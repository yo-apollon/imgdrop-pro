"use client";

import React, { useState } from "react";
import { UploadQueueItem } from "@/types";
import ResultCard from "./ResultCard";
import { formatBytes, copyToClipboard } from "@/lib/utils";
import { Check, Copy, Loader2, AlertCircle, Trash2, ListChecks } from "lucide-react";

interface Props {
  queue: UploadQueueItem[];
  onClearQueue: () => void;
  onDeleteItem: (id: string) => void;
}

export default function UploadQueue({ queue, onClearQueue, onDeleteItem }: Props) {
  const [copiedBatch, setCopiedBatch] = useState<string | null>(null);

  if (queue.length === 0) return null;

  const successfulItems = queue.filter((x) => x.status === "success" && x.result);
  const isUploadingAny = queue.some((x) => x.status === "uploading");

  const handleCopyAllLinks = async () => {
    const links = successfulItems.map((x) => x.result!.url).join("\n");
    if (links) {
      await copyToClipboard(links);
      setCopiedBatch("links");
      setTimeout(() => setCopiedBatch(null), 2000);
    }
  };

  const handleCopyAllMarkdown = async () => {
    const md = successfulItems
      .map((x) => `![${x.result!.filename}](${x.result!.url})`)
      .join("\n");
    if (md) {
      await copyToClipboard(md);
      setCopiedBatch("md");
      setTimeout(() => setCopiedBatch(null), 2000);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      {/* Batch toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-dark-surface/80 border border-dark-border/80">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-brand-emerald" />
          <span className="text-xs font-semibold text-dark-text">
            {successfulItems.length} de {queue.length} imagens processadas
          </span>
          {isUploadingAny && (
            <span className="flex items-center gap-1.5 text-xs text-brand-cyan">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Enviando...</span>
            </span>
          )}
        </div>

        {successfulItems.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyAllLinks}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                copiedBatch === "links"
                  ? "bg-brand-emerald text-dark-bg font-semibold"
                  : "bg-dark-card hover:bg-dark-hover border border-dark-border text-dark-text"
              }`}
            >
              {copiedBatch === "links" ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Todos Copiados!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-brand-emerald" />
                  <span>Copiar Todos os Links</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyAllMarkdown}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                copiedBatch === "md"
                  ? "bg-brand-emerald text-dark-bg font-semibold"
                  : "bg-dark-card hover:bg-dark-hover border border-dark-border text-dark-text"
              }`}
            >
              {copiedBatch === "md" ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Markdown Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-brand-cyan" />
                  <span>Copiar Todos (Markdown)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClearQueue}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-dark-muted hover:text-brand-rose transition-colors"
              title="Limpar lista"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Upload items grid / list */}
      <div className="flex flex-col gap-4">
        {queue.map((item) => {
          if (item.status === "success" && item.result) {
            return (
              <ResultCard
                key={item.id}
                image={item.result}
                onDelete={() => onDeleteItem(item.id)}
              />
            );
          }

          return (
            <div
              key={item.id}
              className="w-full bg-dark-card/60 border border-dark-border rounded-2xl p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-dark-surface border border-dark-border shrink-0 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex flex-col">
                  <span className="text-xs font-medium text-dark-text truncate">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-dark-muted font-mono">
                    {formatBytes(item.size)}
                  </span>
                </div>
              </div>

              {item.status === "uploading" && (
                <div className="flex items-center gap-2 text-xs text-brand-emerald">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs font-mono">Processando...</span>
                </div>
              )}

              {item.status === "error" && (
                <div className="flex items-center gap-1.5 text-xs text-brand-rose">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="text-xs">{item.errorMessage || "Erro no envio"}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

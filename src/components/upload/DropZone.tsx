"use client";

import React, { useRef, useState, useEffect } from "react";
import { UploadCloud, Image as ImageIcon, Link2, Copy, Sparkles, AlertCircle } from "lucide-react";

interface Props {
  onFilesSelected: (files: File[]) => void;
  onOpenUrlModal: () => void;
  isUploading: boolean;
}

export default function DropZone({ onFilesSelected, onOpenUrlModal, isUploading }: Props) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isWindowDragOver, setIsWindowDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global paste handler (Ctrl + V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const imageFiles: File[] = [];
        for (let i = 0; i < e.clipboardData.files.length; i++) {
          const file = e.clipboardData.files[i];
          if (file.type.startsWith("image/")) {
            imageFiles.push(file);
          }
        }

        if (imageFiles.length > 0) {
          e.preventDefault();
          onFilesSelected(imageFiles);
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [onFilesSelected]);

  // Global window drag detection
  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer && e.dataTransfer.types.includes("Files")) {
        setIsWindowDragOver(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        setIsWindowDragOver(false);
        setIsDragOver(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsWindowDragOver(false);
      setIsDragOver(false);

      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        const imageFiles: File[] = [];
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          const file = e.dataTransfer.files[i];
          if (file.type.startsWith("image/") || file.name.endsWith(".svg") || file.name.endsWith(".ico")) {
            imageFiles.push(file);
          }
        }
        if (imageFiles.length > 0) {
          onFilesSelected(imageFiles);
        }
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [onFilesSelected]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      onFilesSelected(selected);
      // reset so same files can be selected again
      e.target.value = "";
    }
  };

  return (
    <div className="relative w-full">
      {/* Full screen drag-and-drop overlay when dragging anywhere */}
      {isWindowDragOver && (
        <div className="fixed inset-0 z-50 bg-dark-bg/85 backdrop-blur-md flex flex-col items-center justify-center p-6 border-4 border-dashed border-brand-emerald animate-fade-in pointer-events-none">
          <div className="w-20 h-20 rounded-2xl bg-brand-emerald/20 flex items-center justify-center text-brand-emerald mb-4 animate-bounce">
            <UploadCloud className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-dark-text mb-2">Solte a imagem aqui!</h2>
          <p className="text-sm text-dark-muted font-mono">
            Processamento instantâneo & conversão automática para URL
          </p>
        </div>
      )}

      {/* Main Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragOver(false);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 p-8 sm:p-12 flex flex-col items-center justify-center text-center ${
          isDragOver
            ? "border-brand-emerald bg-brand-emerald/10 scale-[1.01] shadow-2xl shadow-brand-emerald/20"
            : "border-dark-borderSubtle hover:border-brand-emerald/60 bg-dark-card/60 hover:bg-dark-card/90"
        }`}
      >
        {/* Subtle background radial spotlight */}
        <div className="absolute inset-0 bg-radial-glow pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.svg,.ico,.avif"
          onChange={handleInputChange}
          className="hidden"
        />

        {/* Floating icon */}
        <div className="relative mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-dark-surface border border-dark-border group-hover:border-brand-emerald/50 flex items-center justify-center text-brand-emerald shadow-xl group-hover:scale-110 transition-transform duration-300">
            <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-brand-cyan/20 border border-brand-cyan/40 flex items-center justify-center text-brand-cyan">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Instructions */}
        <h3 className="text-lg sm:text-xl font-bold text-dark-text tracking-tight mb-2">
          Arraste e solte suas imagens aqui
        </h3>
        <p className="text-xs sm:text-sm text-dark-muted max-w-md mb-6">
          Ou clique para navegar no seu dispositivo. Suporta envio em lote, fotos de câmera e captura de tela.
        </p>

        {/* CTA Buttons */}
        <div
          className="flex flex-wrap items-center justify-center gap-3 relative z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-emerald to-emerald-600 hover:from-brand-emeraldLight hover:to-emerald-500 text-dark-bg font-semibold text-xs sm:text-sm transition-all shadow-lg shadow-brand-emerald/25 hover:shadow-brand-emerald/40 hover:-translate-y-0.5 cursor-pointer"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Selecionar Imagens</span>
          </button>

          <button
            type="button"
            onClick={onOpenUrlModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-dark-surface hover:bg-dark-hover border border-dark-border hover:border-dark-borderSubtle text-dark-text font-medium text-xs sm:text-sm transition-all cursor-pointer"
          >
            <Link2 className="w-4 h-4 text-brand-cyan" />
            <span>Importar por URL</span>
          </button>
        </div>

        {/* Clipboard helper hint */}
        <div className="mt-8 pt-6 border-t border-dark-border/40 w-full max-w-sm flex items-center justify-center gap-2 text-xs text-dark-muted/80 font-mono">
          <Copy className="w-3.5 h-3.5 text-brand-cyan" />
          <span>Dica: Pressione </span>
          <kbd className="px-1.5 py-0.5 rounded bg-dark-surface border border-dark-border text-dark-text text-[11px] font-semibold">
            Ctrl + V
          </kbd>
          <span> em qualquer lugar</span>
        </div>
      </div>
    </div>
  );
}

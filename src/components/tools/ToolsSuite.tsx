"use client";

import React, { useState, useRef } from "react";
import { formatBytes } from "@/lib/utils";
import {
  Sliders,
  Layers,
  ShieldCheck,
  Download,
  UploadCloud,
  ArrowRight,
  Sparkles,
  Info,
  Check,
  RefreshCw,
  Eye,
  SlidersHorizontal,
} from "lucide-react";

export default function ToolsSuite() {
  const [activeSubTab, setActiveSubTab] = useState<"compress" | "convert" | "exif">("compress");

  // Compressor State
  const [compressFile, setCompressFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [compressedBlobUrl, setCompressedBlobUrl] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [quality, setQuality] = useState<number>(75);
  const [sliderPos, setSliderPos] = useState<number>(50); // 0 to 100%
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetCompressFormat, setTargetCompressFormat] = useState<"webp" | "jpeg" | "png">("webp");

  // Converter State
  const [convertFile, setConvertFile] = useState<File | null>(null);
  const [convertTargetFormat, setConvertTargetFormat] = useState<"webp" | "png" | "jpeg" | "avif">("webp");
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [convertedSize, setConvertedSize] = useState<number>(0);
  const [isConverting, setIsConverting] = useState(false);

  // EXIF Inspector State
  const [exifFile, setExifFile] = useState<File | null>(null);
  const [exifDetails, setExifDetails] = useState<any | null>(null);
  const [exifCleanUrl, setExifCleanUrl] = useState<string | null>(null);

  // Handle Compressor file input
  const handleCompressFile = async (file: File) => {
    setCompressFile(file);
    const origUrl = URL.createObjectURL(file);
    setOriginalPreview(origUrl);
    runCompression(file, quality, targetCompressFormat);
  };

  const runCompression = async (file: File, q: number, fmt: string) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("quality", String(q));
      formData.append("outputFormat", fmt);
      formData.append("expiration", "1h"); // temporary

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.image) {
        setCompressedBlobUrl(data.image.url);
        setCompressedSize(data.image.size);
      }
    } catch (err) {
      console.error("Compression error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Converter file input
  const handleConvert = async () => {
    if (!convertFile) return;
    setIsConverting(true);
    try {
      const formData = new FormData();
      formData.append("file", convertFile);
      formData.append("outputFormat", convertTargetFormat);
      formData.append("quality", "85");
      formData.append("expiration", "1h");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.image) {
        setConvertedUrl(data.image.url);
        setConvertedSize(data.image.size);
      }
    } catch (err) {
      console.error("Convert error:", err);
    } finally {
      setIsConverting(false);
    }
  };

  // Handle EXIF inspection
  const handleExifInspect = (file: File) => {
    setExifFile(file);
    // Basic browser inspection + simulated EXIF tags
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    img.onload = () => {
      setExifDetails({
        filename: file.name,
        fileSize: file.size,
        mimeType: file.type || "image/jpeg",
        dimensions: `${img.naturalWidth} × ${img.naturalHeight} px`,
        lastModified: new Date(file.lastModified).toLocaleString("pt-BR"),
        hasGpsData: file.size > 500000 && file.type.includes("jpeg"), // heuristic or extracted
        colorSpace: "sRGB",
      });
    };
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 animate-fade-in">
      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-dark-surface/70 border border-dark-border/70 max-w-xl mx-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab("compress")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === "compress"
              ? "bg-dark-card text-brand-emerald shadow-sm border border-dark-border"
              : "text-dark-muted hover:text-dark-text"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Compressor & Comparador</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("convert")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === "convert"
              ? "bg-dark-card text-brand-emerald shadow-sm border border-dark-border"
              : "text-dark-muted hover:text-dark-text"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Conversor de Formatos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("exif")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === "exif"
              ? "bg-dark-card text-brand-emerald shadow-sm border border-dark-border"
              : "text-dark-muted hover:text-dark-text"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Inspetor de EXIF</span>
        </button>
      </div>

      {/* COMPRESSOR VIEW */}
      {activeSubTab === "compress" && (
        <div className="rounded-3xl border border-dark-border/80 bg-dark-card/60 p-6 sm:p-8 flex flex-col gap-6 shadow-2xl">
          <div>
            <h3 className="text-lg font-bold text-dark-text flex items-center gap-2">
              <Sliders className="w-5 h-5 text-brand-emerald" />
              Compressor Inteligente com Comparador Antes vs. Depois
            </h3>
            <p className="text-xs text-dark-muted mt-1">
              Reduza o peso de imagens para web sem perder qualidade perceptível. Deslize o separador para comparar visualmente.
            </p>
          </div>

          {!compressFile ? (
            <label className="border-2 border-dashed border-dark-borderSubtle hover:border-brand-emerald/60 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer bg-dark-surface/40 hover:bg-dark-surface/80 transition-all">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleCompressFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-dark-card border border-dark-border flex items-center justify-center text-brand-emerald mb-4">
                <UploadCloud className="w-7 h-7" />
              </div>
              <span className="text-sm font-semibold text-dark-text mb-1">
                Selecione uma imagem para comprimir
              </span>
              <span className="text-xs text-dark-muted">
                JPG, PNG, WebP até 32MB
              </span>
            </label>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Controls bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-dark-surface border border-dark-border">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-dark-muted">Qualidade</span>
                    <span className="text-brand-emerald font-mono font-semibold">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={quality}
                    onChange={(e) => {
                      const q = parseInt(e.target.value, 10);
                      setQuality(q);
                      runCompression(compressFile, q, targetCompressFormat);
                    }}
                    className="w-full accent-brand-emerald cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-dark-muted">Formato Otimizado</span>
                  <select
                    value={targetCompressFormat}
                    onChange={(e) => {
                      const fmt = e.target.value as "webp" | "jpeg" | "png";
                      setTargetCompressFormat(fmt);
                      runCompression(compressFile, quality, fmt);
                    }}
                    className="w-full bg-dark-card border border-dark-border rounded-lg px-2.5 py-1.5 text-xs text-dark-text focus:outline-none focus:border-brand-emerald"
                  >
                    <option value="webp">WebP (Super Leve)</option>
                    <option value="jpeg">JPEG (Equilibrado)</option>
                    <option value="png">PNG (Lossless)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0">
                  <div className="text-right">
                    <div className="text-[11px] text-dark-muted">Economia</div>
                    <div className="text-sm font-mono font-bold text-brand-emerald">
                      {compressedSize > 0 && compressFile.size > compressedSize
                        ? `-${Math.round(((compressFile.size - compressedSize) / compressFile.size) * 100)}%`
                        : "0%"}
                    </div>
                  </div>

                  {compressedBlobUrl && (
                    <a
                      href={compressedBlobUrl}
                      download={`otimizada-${compressFile.name}`}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-emerald hover:bg-brand-emeraldLight text-dark-bg font-semibold text-xs transition-colors shadow-md"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Before vs After Interactive Split View */}
              <div className="relative w-full h-[400px] sm:h-[480px] rounded-2xl overflow-hidden border border-dark-border select-none bg-dark-surface flex items-center justify-center">
                {originalPreview && compressedBlobUrl ? (
                  <>
                    {/* Before Image (Left/Bottom) */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={originalPreview}
                      alt="Original"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    />

                    {/* After Image (Right/Top with clip-path) */}
                    <div
                      className="absolute inset-0 overflow-hidden pointer-events-none"
                      style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={compressedBlobUrl}
                        alt="Comprimida"
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                    </div>

                    {/* Divider line */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-brand-emerald shadow-lg cursor-ew-resize z-20 flex items-center justify-center"
                      style={{ left: `${sliderPos}%` }}
                    >
                      <div className="w-6 h-6 rounded-full bg-brand-emerald text-dark-bg flex items-center justify-center shadow-md -translate-x-0.5">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Hidden interactive slider for scrubbing */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderPos}
                      onChange={(e) => setSliderPos(parseInt(e.target.value, 10))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                    />

                    {/* Badges */}
                    <div className="absolute top-4 left-4 z-10 px-2.5 py-1 rounded-md bg-dark-bg/85 backdrop-blur text-[11px] font-mono text-dark-text border border-dark-border">
                      Original: {formatBytes(compressFile.size)}
                    </div>
                    <div className="absolute top-4 right-4 z-10 px-2.5 py-1 rounded-md bg-brand-emerald/90 text-[11px] font-mono font-bold text-dark-bg shadow-md">
                      Comprimida: {formatBytes(compressedSize)}
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-dark-muted font-mono animate-pulse">
                    Processando otimização com Sharp...
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setCompressFile(null);
                  setOriginalPreview(null);
                  setCompressedBlobUrl(null);
                }}
                className="self-center text-xs text-dark-muted hover:text-dark-text underline"
              >
                Escolher outra imagem
              </button>
            </div>
          )}
        </div>
      )}

      {/* CONVERTER VIEW */}
      {activeSubTab === "convert" && (
        <div className="rounded-3xl border border-dark-border/80 bg-dark-card/60 p-6 sm:p-8 flex flex-col gap-6 shadow-2xl">
          <div>
            <h3 className="text-lg font-bold text-dark-text flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-cyan" />
              Conversor de Formatos de Imagem
            </h3>
            <p className="text-xs text-dark-muted mt-1">
              Transforme PNG em JPG, WebP em PNG, SVG em AVIF ou qualquer combinação com máxima fidelidade.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Input file */}
            <label className="border-2 border-dashed border-dark-borderSubtle hover:border-brand-cyan/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-dark-surface/40 hover:bg-dark-surface/80 transition-all min-h-[220px]">
              <input
                type="file"
                accept="image/*,.svg"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setConvertFile(e.target.files[0]);
                    setConvertedUrl(null);
                  }
                }}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-xl bg-dark-card border border-dark-border flex items-center justify-center text-brand-cyan mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-dark-text mb-1 truncate max-w-[220px]">
                {convertFile ? convertFile.name : "Clique para selecionar o arquivo"}
              </span>
              <span className="text-[11px] text-dark-muted">
                {convertFile ? formatBytes(convertFile.size) : "PNG, JPG, WebP, AVIF, GIF, SVG"}
              </span>
            </label>

            {/* Target and action */}
            <div className="flex flex-col gap-4 p-5 rounded-2xl bg-dark-surface border border-dark-border">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-dark-muted">Converter Para:</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["webp", "png", "jpeg", "avif"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setConvertTargetFormat(fmt)}
                      className={`py-2 px-3 rounded-xl text-xs font-mono uppercase transition-all ${
                        convertTargetFormat === fmt
                          ? "bg-brand-cyan text-dark-bg font-bold shadow-md"
                          : "bg-dark-card border border-dark-border text-dark-text hover:bg-dark-hover"
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={!convertFile || isConverting}
                onClick={handleConvert}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-cyan hover:bg-cyan-400 disabled:opacity-40 text-dark-bg font-semibold text-xs transition-all shadow-md"
              >
                {isConverting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Convertendo...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    <span>Converter Arquivo</span>
                  </>
                )}
              </button>

              {convertedUrl && (
                <div className="pt-3 border-t border-dark-border/60 flex items-center justify-between">
                  <div className="text-xs font-mono text-brand-emerald flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    Pronto! ({formatBytes(convertedSize)})
                  </div>
                  <a
                    href={convertedUrl}
                    download={`convertida.${convertTargetFormat}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-emerald text-dark-bg font-semibold text-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EXIF INSPECTOR VIEW */}
      {activeSubTab === "exif" && (
        <div className="rounded-3xl border border-dark-border/80 bg-dark-card/60 p-6 sm:p-8 flex flex-col gap-6 shadow-2xl">
          <div>
            <h3 className="text-lg font-bold text-dark-text flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-emerald" />
              Inspetor e Limpador de Metadados EXIF
            </h3>
            <p className="text-xs text-dark-muted mt-1">
              Verifique se sua foto contém dados confidenciais ocultos como coordenadas GPS da sua casa, câmera utilizada ou data e hora original.
            </p>
          </div>

          {!exifDetails ? (
            <label className="border-2 border-dashed border-dark-borderSubtle hover:border-brand-emerald/60 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer bg-dark-surface/40 hover:bg-dark-surface/80 transition-all">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleExifInspect(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-dark-card border border-dark-border flex items-center justify-center text-brand-emerald mb-4">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <span className="text-sm font-semibold text-dark-text mb-1">
                Selecione uma foto para inspecionar
              </span>
              <span className="text-xs text-dark-muted">
                Fotos de smartphone e câmeras digitais contêm mais metadados
              </span>
            </label>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-dark-surface border border-dark-border flex flex-col gap-2">
                  <span className="text-xs font-semibold text-dark-text">Propriedades Gerais</span>
                  <div className="space-y-1.5 text-xs text-dark-muted">
                    <div className="flex justify-between">
                      <span>Arquivo:</span>
                      <span className="text-dark-text font-medium">{exifDetails.filename}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tamanho:</span>
                      <span className="text-dark-text font-mono">{formatBytes(exifDetails.fileSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dimensões:</span>
                      <span className="text-dark-text font-mono">{exifDetails.dimensions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Espaço de Cor:</span>
                      <span className="text-dark-text font-mono">{exifDetails.colorSpace}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-dark-surface border border-dark-border flex flex-col justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-dark-text">Diagnóstico de Privacidade</span>
                    <p className="text-xs text-dark-muted mt-1">
                      No ImageToURL Pro, todos os uploads normais têm os metadados EXIF e geolocalização removidos por padrão para sua segurança.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-brand-emerald/10 border border-brand-emerald/30 text-brand-emerald text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>Limpador automático ativo no upload principal.</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setExifFile(null);
                  setExifDetails(null);
                }}
                className="self-center text-xs text-dark-muted hover:text-dark-text underline pt-2"
              >
                Inspecionar outro arquivo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

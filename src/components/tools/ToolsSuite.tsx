"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { formatBytes, copyToClipboard } from "@/lib/utils";
import {
  compressImageClient,
  parseExifData,
  ParsedExifData,
  isFormatSupported,
} from "@/lib/clientImageTools";
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
  CloudUpload,
  ExternalLink,
  Copy,
  AlertTriangle,
  MapPin,
  Camera,
  Share2,
} from "lucide-react";

export default function ToolsSuite() {
  const [activeSubTab, setActiveSubTab] = useState<"compress" | "convert" | "exif">("compress");

  // ==========================================
  // COMPRESSOR STATE
  // ==========================================
  const [compressFile, setCompressFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [compressedBlobUrl, setCompressedBlobUrl] = useState<string | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [compressedDims, setCompressedDims] = useState<{ width: number; height: number } | null>(null);
  const [quality, setQuality] = useState<number>(80);
  const [sliderPos, setSliderPos] = useState<number>(50); // 0 to 100%
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressError, setCompressError] = useState<string | null>(null);
  const [targetCompressFormat, setTargetCompressFormat] = useState<"webp" | "jpeg" | "png">("webp");

  // Compressor Upload / Cloud Hosting State
  const [isHostingCompressed, setIsHostingCompressed] = useState(false);
  const [hostedCompressedUrl, setHostedCompressedUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      }
    };
  }, []);

  // Handle Compressor file input
  const handleCompressFile = async (file: File) => {
    setCompressFile(file);
    setCompressError(null);
    setHostedCompressedUrl(null);

    const origUrl = URL.createObjectURL(file);
    setOriginalPreview(origUrl);

    await executeCompression(file, quality, targetCompressFormat);
  };

  const executeCompression = useCallback(
    async (file: File, q: number, fmt: "webp" | "jpeg" | "png") => {
      setIsProcessing(true);
      setCompressError(null);

      try {
        const result = await compressImageClient(file, {
          quality: q,
          format: fmt,
        });

        // Revoke previous blob URL to prevent memory leaks
        if (currentBlobUrlRef.current) {
          URL.revokeObjectURL(currentBlobUrlRef.current);
        }

        currentBlobUrlRef.current = result.blobUrl;
        setCompressedBlobUrl(result.blobUrl);
        setCompressedBlob(result.blob);
        setCompressedSize(result.size);
        setCompressedDims({ width: result.width, height: result.height });
      } catch (err: any) {
        console.error("Compression error:", err);
        setCompressError(err.message || "Erro ao processar imagem");
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  // Debounced slider & format change handler
  const handleQualityChange = (newQuality: number) => {
    setQuality(newQuality);
    if (!compressFile) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      executeCompression(compressFile, newQuality, targetCompressFormat);
    }, 80);
  };

  const handleFormatChange = (newFormat: "webp" | "jpeg" | "png") => {
    setTargetCompressFormat(newFormat);
    if (!compressFile) return;
    executeCompression(compressFile, quality, newFormat);
  };

  // Upload compressed image to ImgDrop Cloud
  const handleHostCompressed = async () => {
    if (!compressedBlob || !compressFile) return;
    setIsHostingCompressed(true);
    try {
      const ext = targetCompressFormat === "jpeg" ? "jpg" : targetCompressFormat;
      const baseName = compressFile.name.substring(0, compressFile.name.lastIndexOf(".")) || "imagem";
      const newFileName = `otimizada-${baseName}.${ext}`;
      const uploadFile = new File([compressedBlob], newFileName, { type: compressedBlob.type });

      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("expiration", "never");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.image) {
        setHostedCompressedUrl(data.image.url);
      } else {
        throw new Error(data.error || "Falha no upload");
      }
    } catch (err: any) {
      alert("Erro ao hospedar imagem: " + (err.message || "Verifique sua conexão"));
    } finally {
      setIsHostingCompressed(false);
    }
  };

  // ==========================================
  // CONVERTER STATE
  // ==========================================
  const [convertFile, setConvertFile] = useState<File | null>(null);
  const [convertTargetFormat, setConvertTargetFormat] = useState<"webp" | "png" | "jpeg" | "avif">("webp");
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [convertedSize, setConvertedSize] = useState<number>(0);
  const [isConverting, setIsConverting] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);

  // Handle Converter action
  const handleConvert = async () => {
    if (!convertFile) return;
    setIsConverting(true);
    setConvertError(null);

    try {
      // 1. Try instant client-side conversion
      const result = await compressImageClient(convertFile, {
        quality: 90,
        format: convertTargetFormat,
      });

      setConvertedUrl(result.blobUrl);
      setConvertedBlob(result.blob);
      setConvertedSize(result.size);
    } catch (clientErr) {
      console.warn("Client conversion fallback to server:", clientErr);
      // Fallback to server sharp
      try {
        const formData = new FormData();
        formData.append("file", convertFile);
        formData.append("outputFormat", convertTargetFormat);
        formData.append("quality", "90");
        formData.append("expiration", "1h");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (data.success && data.image) {
          setConvertedUrl(data.image.url);
          setConvertedSize(data.image.size);
        } else {
          throw new Error(data.error || "Erro ao converter no servidor");
        }
      } catch (serverErr: any) {
        setConvertError(serverErr.message || "Falha ao converter arquivo");
      }
    } finally {
      setIsConverting(false);
    }
  };

  // ==========================================
  // EXIF INSPECTOR & SANITIZER STATE
  // ==========================================
  const [exifFile, setExifFile] = useState<File | null>(null);
  const [exifDetails, setExifDetails] = useState<ParsedExifData | null>(null);
  const [isExtractingExif, setIsExtractingExif] = useState(false);
  const [sanitizedBlobUrl, setSanitizedBlobUrl] = useState<string | null>(null);
  const [isSanitizing, setIsSanitizing] = useState(false);

  const handleExifInspect = async (file: File) => {
    setExifFile(file);
    setIsExtractingExif(true);
    setSanitizedBlobUrl(null);

    try {
      const data = await parseExifData(file);
      setExifDetails(data);
    } catch (err) {
      console.error("EXIF parsing error:", err);
    } finally {
      setIsExtractingExif(false);
    }
  };

  const handleSanitizeExif = async () => {
    if (!exifFile) return;
    setIsSanitizing(true);
    try {
      const cleanResult = await compressImageClient(exifFile, {
        quality: 95,
        format: "jpeg",
      });
      setSanitizedBlobUrl(cleanResult.blobUrl);
    } catch (err) {
      console.error("Sanitizing error:", err);
    } finally {
      setIsSanitizing(false);
    }
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
              ? "bg-dark-card text-brand-cyan shadow-sm border border-dark-border"
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
          <span>Inspetor de EXIF & GPS</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* COMPRESSOR VIEW */}
      {/* ========================================================= */}
      {activeSubTab === "compress" && (
        <div className="rounded-3xl border border-dark-border/80 bg-dark-card/60 p-6 sm:p-8 flex flex-col gap-6 shadow-2xl">
          <div>
            <h3 className="text-lg font-bold text-dark-text flex items-center gap-2">
              <Sliders className="w-5 h-5 text-brand-emerald" />
              Compressor Inteligente em Tempo Real (Antes vs. Depois)
            </h3>
            <p className="text-xs text-dark-muted mt-1">
              Otimização instantânea acelerada por hardware no navegador. Compare visualmente sem compressão de rede nem limites.
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
                JPG, PNG, WebP, AVIF até 50MB • Processamento instantâneo
              </span>
            </label>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Controls bar */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-dark-surface border border-dark-border items-center">
                {/* Quality Slider */}
                <div className="flex flex-col gap-1.5 sm:col-span-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-dark-muted">Qualidade</span>
                    <span className="text-brand-emerald font-mono font-semibold">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={quality}
                    onChange={(e) => handleQualityChange(parseInt(e.target.value, 10))}
                    className="w-full accent-brand-emerald cursor-pointer"
                  />
                </div>

                {/* Target Format */}
                <div className="flex flex-col gap-1.5 sm:col-span-1">
                  <span className="text-xs text-dark-muted">Formato Otimizado</span>
                  <select
                    value={targetCompressFormat}
                    onChange={(e) => handleFormatChange(e.target.value as "webp" | "jpeg" | "png")}
                    className="w-full bg-dark-card border border-dark-border rounded-lg px-2.5 py-1.5 text-xs text-dark-text focus:outline-none focus:border-brand-emerald"
                  >
                    <option value="webp">WebP (Super Leve)</option>
                    <option value="jpeg">JPEG (Equilibrado)</option>
                    <option value="png">PNG (Lossless)</option>
                  </select>
                </div>

                {/* Savings Indicator */}
                <div className="flex flex-col items-start sm:items-center justify-center">
                  <div className="text-[11px] text-dark-muted">Economia de Espaço</div>
                  <div className="text-base font-mono font-bold text-brand-emerald">
                    {compressedSize > 0 && compressFile.size > compressedSize
                      ? `-${Math.round(((compressFile.size - compressedSize) / compressFile.size) * 100)}%`
                      : "0%"}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2">
                  {compressedBlobUrl && (
                    <a
                      href={compressedBlobUrl}
                      download={`otimizada-${compressFile.name.substring(0, compressFile.name.lastIndexOf(".")) || "img"}.${targetCompressFormat === "jpeg" ? "jpg" : targetCompressFormat}`}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-emerald hover:bg-brand-emeraldLight text-dark-bg font-semibold text-xs transition-colors shadow-md"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={handleHostCompressed}
                    disabled={isHostingCompressed || !compressedBlob}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-dark-card hover:bg-dark-hover border border-dark-border text-dark-text text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {isHostingCompressed ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-emerald" />
                    ) : (
                      <CloudUpload className="w-3.5 h-3.5 text-brand-emerald" />
                    )}
                    <span>{isHostingCompressed ? "Hospedando..." : "Gerar Link"}</span>
                  </button>
                </div>
              </div>

              {/* Hosting URL Feedback Banner */}
              {hostedCompressedUrl && (
                <div className="p-3.5 rounded-xl bg-brand-emerald/10 border border-brand-emerald/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 overflow-hidden w-full">
                    <Check className="w-4 h-4 text-brand-emerald shrink-0" />
                    <span className="text-dark-muted shrink-0">Hospedado no CDN:</span>
                    <a
                      href={hostedCompressedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-emerald font-mono truncate hover:underline"
                    >
                      {hostedCompressedUrl}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={async () => {
                        await copyToClipboard(hostedCompressedUrl);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="px-2.5 py-1 rounded-md bg-dark-card border border-dark-border text-dark-text hover:text-brand-emerald flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedLink ? "Copiado!" : "Copiar"}</span>
                    </button>
                    <a
                      href={hostedCompressedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-md bg-brand-emerald text-dark-bg font-semibold flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Abrir</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {compressError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{compressError}</span>
                  <button
                    onClick={() => executeCompression(compressFile, quality, targetCompressFormat)}
                    className="ml-auto underline"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}

              {/* Before vs After Interactive Split View */}
              <div className="relative w-full h-[380px] sm:h-[460px] rounded-2xl overflow-hidden border border-dark-border select-none bg-dark-surface flex items-center justify-center">
                {originalPreview && compressedBlobUrl ? (
                  <>
                    {/* Before Image (Left / Full base) */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={originalPreview}
                      alt="Original"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    />

                    {/* After Image (Right / Clipped overlay) */}
                    <div
                      className="absolute inset-0 overflow-hidden pointer-events-none"
                      style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={compressedBlobUrl}
                        alt="Otimizada"
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                    </div>

                    {/* Divider line & handle */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-brand-emerald shadow-[0_0_12px_rgba(16,185,129,0.8)] cursor-ew-resize z-20 flex items-center justify-center"
                      style={{ left: `${sliderPos}%` }}
                    >
                      <div className="w-7 h-7 rounded-full bg-brand-emerald text-dark-bg flex items-center justify-center shadow-lg -translate-x-0.5 border-2 border-white/80">
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

                    {/* Floating Badges */}
                    <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-lg bg-dark-bg/90 backdrop-blur text-xs font-mono text-dark-text border border-dark-border shadow-md">
                      Original: <span className="text-white font-bold">{formatBytes(compressFile.size)}</span>
                    </div>

                    <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-lg bg-brand-emerald text-xs font-mono font-bold text-dark-bg shadow-lg flex items-center gap-1.5">
                      {isProcessing && <RefreshCw className="w-3 h-3 animate-spin" />}
                      <span>Otimizada: {formatBytes(compressedSize)}</span>
                    </div>

                    {/* Hint text at bottom */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-dark-bg/80 backdrop-blur border border-dark-border/50 text-[11px] text-dark-muted pointer-events-none">
                      Arraste o divisor para comparar antes e depois
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-xs text-dark-muted font-mono">
                    <RefreshCw className="w-5 h-5 animate-spin text-brand-emerald" />
                    <span>Processando otimização visual...</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setCompressFile(null);
                  setOriginalPreview(null);
                  setCompressedBlobUrl(null);
                  setCompressedBlob(null);
                  setHostedCompressedUrl(null);
                }}
                className="self-center text-xs text-dark-muted hover:text-dark-text underline transition-colors"
              >
                Escolher outra imagem
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* CONVERTER VIEW */}
      {/* ========================================================= */}
      {activeSubTab === "convert" && (
        <div className="rounded-3xl border border-dark-border/80 bg-dark-card/60 p-6 sm:p-8 flex flex-col gap-6 shadow-2xl">
          <div>
            <h3 className="text-lg font-bold text-dark-text flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-cyan" />
              Conversor Ultrarrápido de Formatos de Imagem
            </h3>
            <p className="text-xs text-dark-muted mt-1">
              Converta PNG para WebP, JPG para PNG, AVIF ou qualquer formato em milissegundos mantendo máxima nitidez.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Input file */}
            <label className="border-2 border-dashed border-dark-borderSubtle hover:border-brand-cyan/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-dark-surface/40 hover:bg-dark-surface/80 transition-all min-h-[220px]">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setConvertFile(e.target.files[0]);
                    setConvertedUrl(null);
                    setConvertedBlob(null);
                    setConvertError(null);
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
                {convertFile ? formatBytes(convertFile.size) : "PNG, JPG, WebP, AVIF, GIF"}
              </span>
            </label>

            {/* Target format selection and action */}
            <div className="flex flex-col justify-between gap-4 p-5 rounded-2xl bg-dark-surface border border-dark-border">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-dark-muted">Formato Desejado:</label>
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

              {convertError && (
                <div className="p-2 rounded-lg bg-red-500/10 text-red-400 text-xs">
                  {convertError}
                </div>
              )}

              <button
                type="button"
                disabled={!convertFile || isConverting}
                onClick={handleConvert}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-cyan hover:bg-cyan-400 disabled:opacity-40 text-dark-bg font-semibold text-xs transition-all shadow-md"
              >
                {isConverting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Convertendo instantaneamente...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    <span>Converter para {convertTargetFormat.toUpperCase()}</span>
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
                    download={`convertida.${convertTargetFormat === "jpeg" ? "jpg" : convertTargetFormat}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-emerald hover:bg-brand-emeraldLight text-dark-bg font-semibold text-xs shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EXIF INSPECTOR & SANITIZER VIEW */}
      {/* ========================================================= */}
      {activeSubTab === "exif" && (
        <div className="rounded-3xl border border-dark-border/80 bg-dark-card/60 p-6 sm:p-8 flex flex-col gap-6 shadow-2xl">
          <div>
            <h3 className="text-lg font-bold text-dark-text flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-emerald" />
              Inspetor de Metadados EXIF & Scanner de Privacidade GPS
            </h3>
            <p className="text-xs text-dark-muted mt-1">
              Inspecione se sua foto contém dados confidenciais gravados por câmeras e smartphones: coordenadas GPS da sua residência, modelo do celular e data/hora.
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
                Fotos de smartphone (iPhone, Samsung) e câmeras contêm dados EXIF e GPS
              </span>
            </label>
          ) : (
            <div className="flex flex-col gap-6">
              {/* GPS Alert (if present) */}
              {exifDetails.gps ? (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 text-amber-400">
                    <MapPin className="w-5 h-5 shrink-0" />
                    <div>
                      <span className="font-bold">Coordenadas de Localização GPS Detectadas:</span>{" "}
                      <span className="font-mono text-dark-text">
                        {exifDetails.gps.latitude}, {exifDetails.gps.longitude}
                      </span>
                    </div>
                  </div>
                  <a
                    href={exifDetails.gps.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-dark-bg font-bold shrink-0 hover:bg-amber-400 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ver no Maps</span>
                  </a>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-brand-emerald/10 border border-brand-emerald/30 text-brand-emerald text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Nenhuma coordenada de geolocalização GPS encontrada nesta imagem.</span>
                </div>
              )}

              {/* Technical details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* General Props */}
                <div className="p-4 rounded-xl bg-dark-surface border border-dark-border flex flex-col gap-2.5">
                  <span className="text-xs font-semibold text-dark-text flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-brand-emerald" />
                    Informações do Arquivo
                  </span>
                  <div className="space-y-1.5 text-xs text-dark-muted">
                    <div className="flex justify-between">
                      <span>Arquivo:</span>
                      <span className="text-dark-text font-medium truncate max-w-[180px]">{exifDetails.filename}</span>
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
                      <span>Formato:</span>
                      <span className="text-dark-text font-mono">{exifDetails.mimeType}</span>
                    </div>
                  </div>
                </div>

                {/* Camera / Hardware Props */}
                <div className="p-4 rounded-xl bg-dark-surface border border-dark-border flex flex-col gap-2.5">
                  <span className="text-xs font-semibold text-dark-text flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-brand-cyan" />
                    Dispositivo e Lente
                  </span>
                  <div className="space-y-1.5 text-xs text-dark-muted">
                    <div className="flex justify-between">
                      <span>Dispositivo:</span>
                      <span className="text-dark-text font-medium">
                        {exifDetails.make || exifDetails.model ? `${exifDetails.make || ""} ${exifDetails.model || ""}`.trim() : "Não especificado"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Data Original:</span>
                      <span className="text-dark-text font-mono">
                        {exifDetails.dateTimeOriginal || exifDetails.lastModified}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Exposição / ISO:</span>
                      <span className="text-dark-text font-mono">
                        {exifDetails.exposureTime || exifDetails.fNumber || exifDetails.iso
                          ? `${exifDetails.exposureTime || ""} ${exifDetails.fNumber || ""} ${exifDetails.iso ? `ISO ${exifDetails.iso}` : ""}`.trim()
                          : "Sem dados EXIF"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lente:</span>
                      <span className="text-dark-text font-mono truncate max-w-[180px]">
                        {exifDetails.lensModel || exifDetails.focalLength || "Padrão"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sanitize Action Bar */}
              <div className="p-4 rounded-2xl bg-dark-surface border border-dark-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-dark-text">Remover Todos os Metadados (Anonimizar)</span>
                  <p className="text-[11px] text-dark-muted mt-0.5">
                    Gera uma cópia limpa da foto sem tags de GPS, dispositivo ou histórico.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSanitizeExif}
                    disabled={isSanitizing}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-emerald hover:bg-brand-emeraldLight text-dark-bg font-semibold text-xs transition-colors shadow-md disabled:opacity-50"
                  >
                    {isSanitizing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    <span>{isSanitizing ? "Limpando..." : "Limpar e Anonimizar"}</span>
                  </button>

                  {sanitizedBlobUrl && (
                    <a
                      href={sanitizedBlobUrl}
                      download={`anonima-${exifDetails.filename}`}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-dark-card border border-dark-border text-dark-text hover:text-brand-emerald text-xs font-medium shadow-sm transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar Limpa</span>
                    </a>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setExifFile(null);
                  setExifDetails(null);
                  setSanitizedBlobUrl(null);
                }}
                className="self-center text-xs text-dark-muted hover:text-dark-text underline transition-colors"
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

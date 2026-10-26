"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import DropZone from "@/components/upload/DropZone";
import UploadOptionsBar from "@/components/upload/UploadOptionsBar";
import UploadQueue from "@/components/upload/UploadQueue";
import UrlModal from "@/components/upload/UrlModal";
import HistoryDrawer from "@/components/history/HistoryDrawer";
import ToolsSuite from "@/components/tools/ToolsSuite";
import ApiDocs from "@/components/api/ApiDocs";
import AuthModal from "@/components/auth/AuthModal";
import UserProfileModal from "@/components/auth/UserProfileModal";
import PricingModal from "@/components/monetization/PricingModal";
import { UploadOptions, UploadQueueItem, UploadedImageMetadata, UserAccount } from "@/types";
import { saveToLocalHistory } from "@/lib/historyStore";
import { getCurrentUser } from "@/lib/userStore";
import { nanoid } from "nanoid";
import { CheckCircle2 } from "lucide-react";
import { upload as vercelBlobUpload } from "@vercel/blob/client";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"upload" | "tools" | "api" | "history">("upload");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  useEffect(() => {
    const update = () => setCurrentUser(getCurrentUser());
    update();
    window.addEventListener("user-auth-changed", update);
    return () => window.removeEventListener("user-auth-changed", update);
  }, []);

  // Upload options
  const [options, setOptions] = useState<UploadOptions>({
    expiration: "never",
    outputFormat: "original",
    stripExif: true,
    maxDimension: undefined,
    quality: 85,
  });

  // Upload queue
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);

  // Add files to queue and start uploading
  const handleFilesSelected = (files: File[]) => {
    const newItems: UploadQueueItem[] = files.map((file) => ({
      id: nanoid(10),
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      progress: 0,
      status: "idle",
    }));

    setQueue((prev) => [...newItems, ...prev]);

    // Process each file
    newItems.forEach((item) => {
      uploadSingleFile(item, options);
    });
  };

  const uploadSingleFile = async (item: UploadQueueItem, opts: UploadOptions) => {
    if (!item.file) return;

    setQueue((prev) =>
      prev.map((x) => (x.id === item.id ? { ...x, status: "uploading", progress: 25 } : x))
    );

    try {
      let result: UploadedImageMetadata;

      // If file > 4.5MB, try direct Vercel Blob client upload first to bypass Vercel serverless limit
      if (item.file.size > 4.5 * 1024 * 1024) {
        try {
          const blob = await vercelBlobUpload(item.file.name, item.file, {
            access: "public",
            handleUploadUrl: "/api/blob/upload",
          });

          // Register in metadata
          const regRes = await fetch("/api/blob/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: blob.url,
              filename: item.file.name,
              size: item.file.size,
              mimeType: item.file.type || "image/png",
              expiration: opts.expiration,
              userId: currentUser?.id,
            }),
          });
          const rawRegText = await regRes.text();
          let regData: any = {};
          try {
            regData = JSON.parse(rawRegText);
          } catch {}
          if (!regRes.ok) {
            throw new Error(regData?.error || rawRegText || "Falha ao registrar imagem no servidor.");
          }
          result = regData.image;
        } catch (blobErr: any) {
          console.error("Direct upload error:", blobErr);
          const rawMsg = blobErr?.message || "";
          if (rawMsg.toLowerCase().includes("client token") || rawMsg.toLowerCase().includes("failed to retrieve")) {
            throw new Error(
              "Vercel Blob não conectado. No painel da Vercel, acesse Storage -> imgdrop-pro-blob -> Connect Project -> selecione imgdrop-pro."
            );
          }
          throw new Error(
            blobErr?.message || `Falha no upload direto: ${(item.file.size / 1024 / 1024).toFixed(1)}MB.`
          );
        }
      } else {
        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("expiration", opts.expiration);
        formData.append("outputFormat", opts.outputFormat);
        formData.append("stripExif", String(opts.stripExif));
        if (opts.maxDimension) {
          formData.append("maxDimension", String(opts.maxDimension));
        }
        if (opts.quality) {
          formData.append("quality", String(opts.quality));
        }
        if (currentUser?.id) {
          formData.append("userId", currentUser.id);
        }

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const rawText = await res.text();
        let data: any = {};
        try {
          data = JSON.parse(rawText);
        } catch {
          // not valid json
        }

        if (!res.ok) {
          if (res.status === 413) {
            throw new Error(
              `Arquivo de ${(item.file.size / 1024 / 1024).toFixed(1)}MB excede o limite serverless da Vercel (4.5MB). Ative o Vercel Blob na aba Storage da Vercel para uploads de até 32MB.`
            );
          }
          throw new Error(data?.error || rawText || `Erro no upload (Status ${res.status}).`);
        }

        result = data.image;
      }

      // Save to local history
      saveToLocalHistory(result);

      // Update item in queue
      setQueue((prev) =>
        prev.map((x) =>
          x.id === item.id
            ? { ...x, status: "success", progress: 100, result }
            : x
        )
      );
    } catch (err: any) {
      setQueue((prev) =>
        prev.map((x) =>
          x.id === item.id
            ? {
                ...x,
                status: "error",
                errorMessage: err?.message || "Falha ao processar arquivo.",
              }
            : x
        )
      );
    }
  };

  // Handle URL import
  const handleImportUrl = async (remoteUrl: string) => {
    setIsUploading(true);
    const tempId = nanoid(10);

    const newItem: UploadQueueItem = {
      id: tempId,
      sourceUrl: remoteUrl,
      previewUrl: remoteUrl,
      name: remoteUrl.substring(remoteUrl.lastIndexOf("/") + 1) || "imported_image",
      size: 0,
      progress: 25,
      status: "uploading",
    };

    setQueue((prev) => [newItem, ...prev]);

    try {
      const res = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: remoteUrl,
          expiration: options.expiration,
          outputFormat: options.outputFormat,
          stripExif: options.stripExif,
          maxDimension: options.maxDimension,
          quality: options.quality,
          userId: currentUser?.id,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro ao importar imagem da URL.");
      }

      const result: UploadedImageMetadata = data.image;
      saveToLocalHistory(result);

      setQueue((prev) =>
        prev.map((x) =>
          x.id === tempId
            ? {
                ...x,
                status: "success",
                name: result.filename,
                size: result.size,
                progress: 100,
                result,
              }
            : x
        )
      );
    } catch (err: any) {
      setQueue((prev) =>
        prev.map((x) =>
          x.id === tempId
            ? {
                ...x,
                status: "error",
                errorMessage: err?.message || "Falha ao importar imagem remota.",
              }
            : x
        )
      );
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteItem = async (queueId: string) => {
    const item = queue.find((x) => x.id === queueId);
    if (item?.result) {
      try {
        await fetch(`/api/images/${item.result.id}?token=${item.result.deleteToken}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("Delete error:", err);
      }
    }
    setQueue((prev) => prev.filter((x) => x.id !== queueId));
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text flex flex-col font-sans selection:bg-brand-emerald/30 selection:text-white">
      {/* Header */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === "history") {
            setIsHistoryOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenPricing={() => setIsPricingModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col items-center">
        {activeTab === "upload" && (
          <div className="w-full max-w-4xl flex flex-col items-center gap-8">
            {/* Hero Title */}
            <div className="text-center flex flex-col items-center max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dark-card border border-dark-border text-[11px] font-medium text-dark-muted mb-4 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
                <span>ImgDrop Pro • Hospedagem Rápida, Privativa e Sem Anúncios</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-dark-text leading-[1.15]">
                Arraste & Solte para Gerar{" "}
                <span className="bg-gradient-to-r from-brand-emerald via-teal-300 to-brand-cyan bg-clip-text text-transparent">
                  URLs Diretas
                </span>{" "}
                Instantaneamente
              </h1>

              <p className="text-sm sm:text-base text-dark-muted mt-3 max-w-xl">
                Hospedagem em nuvem de alta performance com geração de links diretos, Markdown, HTML, BBCode e QR Code. Sem anúncios, com remoção de metadados EXIF e suporte a uploads em lote.
              </p>

              {/* Quick perks */}
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-4 text-xs text-dark-muted font-medium">
                <span className="flex items-center gap-1.5 text-dark-text">
                  <CheckCircle2 className="w-4 h-4 text-brand-emerald" />
                  Até 32MB por arquivo
                </span>
                <span className="flex items-center gap-1.5 text-dark-text">
                  <CheckCircle2 className="w-4 h-4 text-brand-emerald" />
                  Limpeza de GPS e EXIF
                </span>
                <span className="flex items-center gap-1.5 text-dark-text">
                  <CheckCircle2 className="w-4 h-4 text-brand-emerald" />
                  Compatível com Vercel & R2
                </span>
              </div>
            </div>

            {/* Drop Zone */}
            <DropZone
              onFilesSelected={handleFilesSelected}
              onOpenUrlModal={() => setIsUrlModalOpen(true)}
              isUploading={isUploading}
            />

            {/* Options Bar */}
            <UploadOptionsBar options={options} onChange={setOptions} />

            {/* Upload Queue / Results */}
            <UploadQueue
              queue={queue}
              onClearQueue={() => setQueue([])}
              onDeleteItem={handleDeleteItem}
            />
          </div>
        )}

        {/* Tools tab */}
        {activeTab === "tools" && <ToolsSuite />}

        {/* API tab */}
        {activeTab === "api" && <ApiDocs />}
      </main>

      {/* URL Import Modal */}
      <UrlModal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
        onSubmit={handleImportUrl}
      />

      {/* History Slide-over Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={() => {
          setCurrentUser(getCurrentUser());
        }}
      />

      {/* Profile Modal */}
      {currentUser && (
        <UserProfileModal
          user={currentUser}
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onOpenPricing={() => setIsPricingModalOpen(true)}
        />
      )}

      {/* Pricing / Monetization Modal */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        onUpgradeSuccess={() => {
          setCurrentUser(getCurrentUser());
        }}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}

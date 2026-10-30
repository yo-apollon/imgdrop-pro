"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Bug,
  Lightbulb,
  HelpCircle,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquarePlus,
  RefreshCw,
} from "lucide-react";
import { getCurrentUser } from "@/lib/userStore";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: Props) {
  const [type, setType] = useState<"bug" | "feature" | "support">("bug");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const user = getCurrentUser();
      if (user?.email) setEmail(user.email);
      setIsSuccess(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMessage("Por favor, descreva o problema ou sugestão.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const diagnostics = includeDiagnostics && typeof window !== "undefined"
      ? {
          url: window.location.href,
          userAgent: navigator.userAgent,
          browser: getBrowserName(),
          os: getOSName(),
          screen: `${window.innerWidth}x${window.innerHeight}`,
        }
      : {};

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim() || undefined,
          description: description.trim(),
          email: email.trim() || undefined,
          metadata: diagnostics,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsSuccess(true);
        setTimeout(() => {
          setTitle("");
          setDescription("");
          setIsSuccess(false);
          onClose();
        }, 2200);
      } else {
        throw new Error(data.error || "Erro ao enviar.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Não foi possível enviar o relato.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-dark-card border border-dark-border rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative my-8 flex flex-col gap-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-dark-muted hover:text-dark-text transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald text-xs font-semibold mb-2">
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span>Central de Atendimento & Feedback</span>
          </div>
          <h2 className="text-xl font-bold text-dark-text tracking-tight">
            Reportar Problema ou Sugestão
          </h2>
          <p className="text-xs text-dark-muted mt-1">
            Encontrou uma falha no upload ou tem uma ideia para melhorar o ImgDrop? Envie diretamente para a equipe técnica.
          </p>
        </div>

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center text-center gap-3 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-brand-emerald/20 border border-brand-emerald/40 text-brand-emerald flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Relato Enviado com Sucesso!</h3>
            <p className="text-xs text-dark-muted max-w-xs">
              Agradecemos seu feedback. Nossa equipe irá analisar e aplicar correções rapidamente.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Category Select Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType("bug")}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                  type === "bug"
                    ? "bg-red-500/10 border-red-500/40 text-red-400 shadow-sm"
                    : "bg-dark-surface border-dark-border text-dark-muted hover:text-dark-text"
                }`}
              >
                <Bug className="w-3.5 h-3.5" />
                <span>Bug / Erro</span>
              </button>

              <button
                type="button"
                onClick={() => setType("feature")}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                  type === "feature"
                    ? "bg-brand-cyan/10 border-brand-cyan/40 text-brand-cyan shadow-sm"
                    : "bg-dark-surface border-dark-border text-dark-muted hover:text-dark-text"
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Sugestão</span>
              </button>

              <button
                type="button"
                onClick={() => setType("support")}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                  type === "support"
                    ? "bg-brand-emerald/10 border-brand-emerald/40 text-brand-emerald shadow-sm"
                    : "bg-dark-surface border-dark-border text-dark-muted hover:text-dark-text"
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Dúvida</span>
              </button>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Title / Summary */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-dark-muted">Título ou Resumo (Opcional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Erro ao fazer upload de imagem PNG de 8MB"
                className="w-full bg-dark-surface border border-dark-border rounded-xl px-3.5 py-2 text-xs text-dark-text placeholder:text-dark-dimmed focus:outline-none focus:border-brand-emerald"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-dark-muted">
                Detalhes do Ocorrido <span className="text-red-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                placeholder="Explique o que aconteceu, mensagem de erro exibida ou o recurso que você gostaria de ver..."
                className="w-full bg-dark-surface border border-dark-border rounded-xl p-3 text-xs text-dark-text placeholder:text-dark-dimmed focus:outline-none focus:border-brand-emerald resize-none"
              />
            </div>

            {/* Contact Email */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-dark-muted">Seu E-mail para Contato (Opcional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com (para te respondermos)"
                className="w-full bg-dark-surface border border-dark-border rounded-xl px-3.5 py-2 text-xs text-dark-text placeholder:text-dark-dimmed focus:outline-none focus:border-brand-emerald"
              />
            </div>

            {/* Diagnostics Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer text-dark-muted text-[11px] select-none">
              <input
                type="checkbox"
                checked={includeDiagnostics}
                onChange={(e) => setIncludeDiagnostics(e.target.checked)}
                className="rounded accent-brand-emerald"
              />
              <span>Incluir dados do navegador e resolução para facilitar o diagnóstico técnico</span>
            </label>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting || !description.trim()}
              className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-emerald hover:bg-brand-emeraldLight disabled:opacity-50 text-dark-bg text-xs font-semibold transition-all shadow-md"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Enviando relato...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Relato para a Equipe</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function getBrowserName(): string {
  if (typeof navigator === "undefined") return "Unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  return "Outro";
}

function getOSName(): string {
  if (typeof navigator === "undefined") return "Unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Win")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return "Outro";
}

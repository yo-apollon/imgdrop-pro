"use client";

import React, { useState } from "react";
import { UserAccount } from "@/types";
import { logoutUser, regenerateApiKey } from "@/lib/userStore";
import { copyToClipboard, formatDate, formatBytes } from "@/lib/utils";
import {
  X,
  User,
  Key,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  Zap,
  HardDrive,
  Sparkles,
} from "lucide-react";

interface Props {
  user: UserAccount;
  isOpen: boolean;
  onClose: () => void;
  onOpenPricing: () => void;
}

export default function UserProfileModal({
  user,
  isOpen,
  onClose,
  onOpenPricing,
}: Props) {
  const [apiKey, setApiKey] = useState(user.apiKey);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleCopyKey = async () => {
    const ok = await copyToClipboard(apiKey);
    if (ok) {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleRegenerate = () => {
    if (confirm("Deseja realmente regerar sua chave de API? A chave antiga parará de funcionar.")) {
      const newKey = regenerateApiKey();
      setApiKey(newKey);
    }
  };

  const handleLogout = () => {
    logoutUser();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-card border border-dark-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-fade-in flex flex-col gap-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-dark-muted hover:text-dark-text transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* User Card Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-emerald to-brand-cyan flex items-center justify-center text-dark-bg font-bold text-xl shadow-lg">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-dark-text truncate">
                {user.name}
              </h3>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  user.plan === "pro"
                    ? "bg-brand-emerald text-dark-bg"
                    : "bg-dark-surface text-dark-muted border border-dark-border"
                }`}
              >
                {user.plan === "pro" ? "PRO ⚡" : "GRÁTIS"}
              </span>
            </div>
            <span className="text-xs text-dark-muted truncate">{user.email}</span>
            <span className="text-[10px] text-dark-dimmed mt-0.5">
              Membro desde {formatDate(user.createdAt)}
            </span>
          </div>
        </div>

        {/* Upgrade Banner if on free plan */}
        {user.plan === "free" && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-emerald/10 via-brand-cyan/10 to-transparent border border-brand-emerald/20 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-semibold text-brand-emeraldLight flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Faça Upgrade para o PRO
              </h4>
              <p className="text-[11px] text-dark-muted mt-0.5">
                Até 50MB por foto, domínio próprio e sem expiração.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPricing();
              }}
              className="px-3 py-1.5 rounded-xl bg-brand-emerald hover:bg-brand-emeraldLight text-dark-bg text-xs font-bold transition-all shadow-md shrink-0"
            >
              Ver Planos
            </button>
          </div>
        )}

        {/* API Key Box */}
        <div className="p-4 rounded-2xl bg-dark-surface border border-dark-border flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-dark-text font-medium flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-brand-cyan" />
              Sua Chave de API
            </span>
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="text-[11px] text-dark-muted hover:text-dark-text underline"
            >
              {showKey ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          <div className="relative flex items-center">
            <input
              type={showKey ? "text" : "password"}
              readOnly
              value={apiKey}
              className="w-full bg-dark-card border border-dark-border rounded-xl px-3 py-2 text-xs font-mono text-dark-text pr-20 select-all"
            />
            <div className="absolute right-1 flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopyKey}
                className="p-1.5 rounded-lg bg-dark-surface hover:bg-dark-hover text-dark-muted hover:text-dark-text transition-colors"
                title="Copiar Chave"
              >
                {copiedKey ? (
                  <Check className="w-3.5 h-3.5 text-brand-emerald" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={handleRegenerate}
                className="p-1.5 rounded-lg bg-dark-surface hover:bg-dark-hover text-dark-muted hover:text-dark-text transition-colors"
                title="Regerar Chave"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <span className="text-[10px] text-dark-dimmed">
            Use no cabeçalho <code className="text-brand-emerald">Authorization: Bearer &lt;chave&gt;</code>
          </span>
        </div>

        {/* Footer actions */}
        <div className="flex justify-between items-center pt-2 border-t border-dark-border/40">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-brand-rose hover:underline font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair da Conta</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-dark-surface border border-dark-border hover:bg-dark-hover text-dark-text text-xs font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

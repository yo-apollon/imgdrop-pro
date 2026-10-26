"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Link2, History, Sparkles, Code2, Layers, User, Zap } from "lucide-react";
import { getLocalHistory } from "@/lib/historyStore";
import { getCurrentUser, syncSupabaseSession } from "@/lib/userStore";
import { UserAccount } from "@/types";

interface Props {
  activeTab: "upload" | "tools" | "api" | "history";
  onTabChange: (tab: "upload" | "tools" | "api" | "history") => void;
  onOpenHistory: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenPricing: () => void;
}

export default function Header({
  activeTab,
  onTabChange,
  onOpenHistory,
  onOpenAuth,
  onOpenProfile,
  onOpenPricing,
}: Props) {
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  useEffect(() => {
    const update = () => {
      setHistoryCount(getLocalHistory().length);
      setCurrentUser(getCurrentUser());
    };

    update();
    syncSupabaseSession().then((user) => {
      if (user) setCurrentUser(user);
    });

    window.addEventListener("local-history-updated", update);
    window.addEventListener("user-auth-changed", update);

    return () => {
      window.removeEventListener("local-history-updated", update);
      window.removeEventListener("user-auth-changed", update);
    };
  }, []);

  return (
    <header className="border-b border-dark-border/60 bg-dark-bg/80 backdrop-blur-xl sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          onClick={() => onTabChange("upload")}
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-emerald to-brand-cyan flex items-center justify-center shadow-lg shadow-brand-emerald/20 group-hover:scale-105 transition-transform">
            <Link2 className="w-5 h-5 text-dark-bg stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-dark-text group-hover:text-brand-emeraldLight transition-colors">
                ImgDrop
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20">
                PRO
              </span>
            </div>
            <span className="text-[10px] text-dark-dimmed hidden sm:block">
              Hospedagem & Conversor de Imagens
            </span>
          </div>
        </Link>

        {/* Center Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-dark-surface/60 p-1 rounded-xl border border-dark-border/60">
          <button
            type="button"
            onClick={() => onTabChange("upload")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "upload"
                ? "bg-dark-card text-brand-emerald shadow-sm border border-dark-border"
                : "text-dark-muted hover:text-dark-text hover:bg-dark-surface"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upload & Link</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("tools")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "tools"
                ? "bg-dark-card text-brand-emerald shadow-sm border border-dark-border"
                : "text-dark-muted hover:text-dark-text hover:bg-dark-surface"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Otimizador & Ferramentas</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("api")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "api"
                ? "bg-dark-card text-brand-emerald shadow-sm border border-dark-border"
                : "text-dark-muted hover:text-dark-text hover:bg-dark-surface"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>API & cURL</span>
          </button>
        </nav>

        {/* Right Actions: Pricing, History, Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Pricing Upgrade Button */}
          <button
            type="button"
            onClick={onOpenPricing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-emerald/15 to-brand-cyan/15 hover:from-brand-emerald/25 hover:to-brand-cyan/25 border border-brand-emerald/30 text-brand-emerald transition-all shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Planos Pro</span>
          </button>

          {/* History Button */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-dark-surface hover:bg-dark-card border border-dark-border text-dark-text hover:border-dark-borderSubtle transition-all shadow-sm"
            title="Ver histórico de uploads"
          >
            <History className="w-3.5 h-3.5 text-brand-cyan" />
            <span className="hidden sm:inline">Histórico</span>
            {historyCount > 0 && (
              <span className="bg-brand-emerald/20 text-brand-emerald font-semibold text-[10px] px-1.5 py-0.2 rounded-full border border-brand-emerald/30">
                {historyCount}
              </span>
            )}
          </button>

          {/* User Auth / Profile */}
          {currentUser ? (
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-dark-card hover:bg-dark-hover border border-dark-border text-xs text-dark-text transition-all"
            >
              <div className="w-5 h-5 rounded-full bg-brand-emerald text-dark-bg font-bold flex items-center justify-center text-[10px]">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:inline font-medium truncate max-w-[100px]">
                {currentUser.name}
              </span>
              {currentUser.plan === "pro" && (
                <span className="bg-brand-emerald text-dark-bg font-bold text-[9px] px-1 rounded">
                  PRO
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-surface hover:bg-dark-card border border-dark-border text-xs font-medium text-dark-text transition-all"
            >
              <User className="w-3.5 h-3.5 text-dark-muted" />
              <span>Entrar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

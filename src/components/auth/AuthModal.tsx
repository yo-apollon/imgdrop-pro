"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  Mail,
  Lock,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  User,
  KeyRound,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { saveUserSession, mapSupabaseToUserAccount } from "@/lib/userStore";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: Props) {
  const [tab, setTab] = useState<"signin" | "signup" | "magic">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const supabase = createClient();
  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const handleDemoLogin = () => {
    const demoUser = {
      id: "usr_demo_" + Math.random().toString(36).substring(2, 9),
      email: email.trim() || "demo@imgdrop.pro",
      name: fullName.trim() || email.split("@")[0] || "Usuário Demo",
      plan: "free" as const,
      apiKey: "itu_live_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString(),
      totalUploads: 0,
      storageUsedBytes: 0,
    };
    saveUserSession(demoUser);
    onLoginSuccess();
    onClose();
  };

  const handleOAuthLogin = async (provider: "google" | "github") => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!supabase) {
      setErrorMessage(
        "Supabase não configurado no painel da Vercel. Você pode usar o botão abaixo para testar em Modo Demonstração."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const redirectOrigin =
        typeof window !== "undefined" ? window.location.origin : "";

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${redirectOrigin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error("OAuth error:", err);
      setErrorMessage(err?.message || "Erro ao iniciar autenticação.");
      setIsSubmitting(false);
    }
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!supabase) {
      if (!email.trim()) {
        setErrorMessage("Informe seu e-mail para prosseguir.");
        return;
      }
      handleDemoLogin();
      return;
    }

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Preencha e-mail e senha.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (tab === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              full_name: fullName.trim() || email.split("@")[0],
            },
          },
        });

        if (error) throw error;

        if (data.session?.user) {
          const userAccount = mapSupabaseToUserAccount(data.session.user);
          saveUserSession(userAccount);
          onLoginSuccess();
          onClose();
        } else {
          setSuccessMessage(
            "Conta criada! Verifique seu e-mail para confirmar seu cadastro e entrar."
          );
        }
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) throw error;

        if (data.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();

          const userAccount = mapSupabaseToUserAccount(data.user, profile);
          saveUserSession(userAccount);
          onLoginSuccess();
          onClose();
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setErrorMessage(err?.message || "Falha na autenticação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!supabase) {
      setErrorMessage("Supabase não configurado.");
      return;
    }

    try {
      setIsSubmitting(true);
      const redirectOrigin =
        typeof window !== "undefined" ? window.location.origin : "";

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${redirectOrigin}/auth/callback`,
        },
      });

      if (error) throw error;

      setSuccessMessage(
        "Link de acesso enviado! Verifique sua caixa de entrada para entrar com 1 clique."
      );
    } catch (err: any) {
      setErrorMessage(err?.message || "Erro ao enviar magic link.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-card border border-dark-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-fade-in flex flex-col gap-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-dark-muted hover:text-dark-text transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-emerald to-brand-cyan flex items-center justify-center text-dark-bg mb-3 shadow-lg shadow-brand-emerald/20">
            <Sparkles className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h3 className="text-xl font-bold text-dark-text tracking-tight">
            {tab === "signup" ? "Criar Conta Real" : "Entrar na sua Conta"}
          </h3>
          <p className="text-xs text-dark-muted mt-1 max-w-xs">
            Gerencie suas imagens na nuvem e acesse sua chave de API REST pessoal.
          </p>
        </div>

        {/* Notice if Supabase keys not set */}
        {!isSupabaseConfigured && (
          <div className="p-3 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/30 text-xs text-brand-cyan flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Supabase Auth Pronto para Conectar</p>
              <p className="text-[11px] text-dark-muted mt-0.5">
                Para ativar logins reais via Google, GitHub e E-mail, adicione as chaves{" "}
                <code className="text-brand-cyan">NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
                <code className="text-brand-cyan">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> nas Environment Variables da Vercel.
              </p>
            </div>
          </div>
        )}

        {/* Social login buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => handleOAuthLogin("google")}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-dark-surface hover:bg-dark-hover border border-dark-border text-dark-text text-xs font-semibold transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continuar com Google</span>
          </button>

          <button
            type="button"
            onClick={() => handleOAuthLogin("github")}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-dark-surface hover:bg-dark-hover border border-dark-border text-dark-text text-xs font-semibold transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>Continuar com GitHub</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-dark-border" />
          <span className="text-[10px] text-dark-muted uppercase font-mono">ou por e-mail</span>
          <div className="flex-1 h-px bg-dark-border" />
        </div>

        {/* Auth Tabs */}
        <div className="flex bg-dark-surface p-1 rounded-xl border border-dark-border text-xs">
          <button
            type="button"
            onClick={() => {
              setTab("signin");
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
              tab === "signin"
                ? "bg-dark-card text-brand-emerald shadow-sm"
                : "text-dark-muted hover:text-dark-text"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("signup");
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
              tab === "signup"
                ? "bg-dark-card text-brand-emerald shadow-sm"
                : "text-dark-muted hover:text-dark-text"
            }`}
          >
            Cadastrar
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("magic");
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
              tab === "magic"
                ? "bg-dark-card text-brand-emerald shadow-sm"
                : "text-dark-muted hover:text-dark-text"
            }`}
          >
            Link Mágico
          </button>
        </div>

        {/* Error / Success alerts */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-brand-rose/10 border border-brand-rose/30 text-xs text-brand-rose flex flex-col gap-2">
            <div>{errorMessage}</div>
            {!isSupabaseConfigured && (
              <button
                type="button"
                onClick={handleDemoLogin}
                className="self-start text-[11px] underline text-brand-emerald hover:text-brand-emeraldLight font-semibold"
              >
                Clique aqui para entrar em Modo Demonstração (Sem Supabase) →
              </button>
            )}
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-brand-emerald/10 border border-brand-emerald/30 text-xs text-brand-emerald">
            {successMessage}
          </div>
        )}

        {/* Form depending on tab */}
        {tab === "magic" ? (
          <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-dark-surface border border-dark-border rounded-xl px-3.5 py-2.5 text-xs text-dark-text placeholder:text-dark-dimmed focus:outline-none focus:border-brand-emerald"
            />
            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-emerald hover:bg-brand-emeraldLight disabled:opacity-50 text-dark-bg text-xs font-semibold transition-all shadow-md mt-1"
            >
              <span>{isSubmitting ? "Enviando..." : "Receber Link de Acesso"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordAuth} className="flex flex-col gap-3">
            {tab === "signup" && (
              <input
                type="text"
                placeholder="Seu Nome Completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-dark-surface border border-dark-border rounded-xl px-3.5 py-2 text-xs text-dark-text placeholder:text-dark-dimmed focus:outline-none focus:border-brand-emerald"
              />
            )}

            <input
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-dark-surface border border-dark-border rounded-xl px-3.5 py-2 text-xs text-dark-text placeholder:text-dark-dimmed focus:outline-none focus:border-brand-emerald"
            />

            <input
              type="password"
              placeholder="Sua Senha (mínimo 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-dark-surface border border-dark-border rounded-xl px-3.5 py-2 text-xs text-dark-text placeholder:text-dark-dimmed focus:outline-none focus:border-brand-emerald"
            />

            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-emerald hover:bg-brand-emeraldLight disabled:opacity-50 text-dark-bg text-xs font-semibold transition-all shadow-md mt-1"
            >
              <span>
                {isSubmitting
                  ? "Carregando..."
                  : tab === "signup"
                  ? "Criar Conta Segura"
                  : "Entrar com Senha"}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {!isSupabaseConfigured && (
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-dark-surface hover:bg-dark-hover border border-dark-border text-dark-text hover:text-brand-emerald text-xs font-semibold transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-emerald" />
            <span>Entrar em Modo Demonstração / Teste</span>
          </button>
        )}

        <div className="bg-dark-surface/60 border border-dark-border/40 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-dark-muted">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-brand-emerald" />
            PostgreSQL & Criptografia Supabase
          </span>
          <span className="font-mono text-brand-emerald">v2.0 Real Auth</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  X,
  Check,
  Zap,
  Sparkles,
  Shield,
  ArrowRight,
  QrCode,
  CreditCard,
  Lock,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { upgradeUserToPro, getCurrentUser } from "@/lib/userStore";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeSuccess: () => void;
  onOpenAuth?: () => void;
}

export default function PricingModal({
  isOpen,
  onClose,
  onUpgradeSuccess,
  onOpenAuth,
}: Props) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedPayment, setSelectedPayment] = useState<"pix" | "card">("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDevFallback, setShowDevFallback] = useState(false);

  if (!isOpen) return null;

  const currentUser = getCurrentUser();

  const handleCheckout = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setShowDevFallback(false);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingCycle,
          currency: "brl",
          paymentMethod: selectedPayment,
          userId: currentUser?.id,
          userEmail: currentUser?.email,
        }),
      });

      const data = await res.json();

      if (res.ok && data.url) {
        // Redirect to real Stripe Checkout (Supports Cards, Apple Pay, Google Pay, PIX)
        window.location.href = data.url;
        return;
      }

      if (data.isConfigured === false || res.status === 400) {
        setErrorMessage(data.error);
        setShowDevFallback(true);
      } else {
        setErrorMessage(data.error || "Erro ao iniciar sessão de pagamento.");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      setErrorMessage("Não foi possível conectar ao gateway de pagamentos.");
      setShowDevFallback(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulatedUpgrade = () => {
    setIsProcessing(true);
    setTimeout(() => {
      upgradeUserToPro();
      setIsProcessing(false);
      onUpgradeSuccess();
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-dark-card border border-dark-border rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative animate-fade-in my-8 flex flex-col gap-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-dark-muted hover:text-dark-text transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald text-xs font-semibold mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>ImgDrop PRO</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-dark-text tracking-tight">
            Desbloqueie Todo o Poder de Hospedagem
          </h2>
          <p className="text-xs sm:text-sm text-dark-muted mt-1.5 max-w-md">
            Hospedagem permanente sem limites de expiração, arquivos de até 50MB e domínio próprio para criadores e empresas.
          </p>

          {/* Billing Switcher */}
          <div className="flex items-center gap-2 mt-4 p-1 rounded-xl bg-dark-surface border border-dark-border">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                billingCycle === "monthly"
                  ? "bg-dark-card text-brand-emerald shadow-sm border border-dark-border"
                  : "text-dark-muted hover:text-dark-text"
              }`}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                billingCycle === "yearly"
                  ? "bg-dark-card text-brand-emerald shadow-sm border border-dark-border"
                  : "text-dark-muted hover:text-dark-text"
              }`}
            >
              <span>Anual</span>
              <span className="bg-brand-emerald/20 text-brand-emerald text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                2 Meses Grátis
              </span>
            </button>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Free Card */}
          <div className="rounded-2xl border border-dark-border p-5 bg-dark-surface/40 flex flex-col justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-dark-text">Plano Grátis</h3>
              <div className="mt-2 text-2xl font-bold text-dark-text">
                R$ 0 <span className="text-xs text-dark-muted font-normal">/ para sempre</span>
              </div>
              <p className="text-[11px] text-dark-muted mt-1">
                Ideal para uploads ocasionais e compartilhamento rápido.
              </p>

              <ul className="mt-4 space-y-2 text-xs text-dark-muted">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
                  <span>Até 5MB por arquivo</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
                  <span>Links diretos, MD, HTML, QR</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
                  <span>Limpeza automática de EXIF</span>
                </li>
                <li className="flex items-center gap-2 text-dark-dimmed line-through">
                  <span>Domínio personalizado</span>
                </li>
                <li className="flex items-center gap-2 text-dark-dimmed line-through">
                  <span>Proteção por senha nos links</span>
                </li>
              </ul>
            </div>

            <div className="text-center py-2 text-xs text-dark-dimmed font-medium">
              {currentUser?.plan === "pro" ? "Plano Anterior" : "Plano Atual"}
            </div>
          </div>

          {/* Pro Card */}
          <div className="rounded-2xl border-2 border-brand-emerald p-5 bg-dark-surface/90 flex flex-col justify-between gap-4 relative shadow-xl shadow-brand-emerald/10">
            <div className="absolute -top-3 right-4 bg-brand-emerald text-dark-bg text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
              Mais Popular
            </div>

            <div>
              <h3 className="text-sm font-bold text-dark-text flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-emerald" />
                Plano PRO
              </h3>
              <div className="mt-2 text-2xl font-extrabold text-dark-text flex items-baseline gap-1">
                {billingCycle === "monthly" ? "R$ 19,90" : "R$ 16,50"}
                <span className="text-xs text-dark-muted font-normal">/ mês</span>
              </div>
              <p className="text-[11px] text-dark-muted mt-1">
                {billingCycle === "yearly"
                  ? "Cobrado anualmente (R$ 199,00)"
                  : "Cancele a qualquer momento"}
              </p>

              <ul className="mt-4 space-y-2 text-xs text-dark-text">
                <li className="flex items-center gap-2 font-medium">
                  <Check className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
                  <span>Até 50MB por imagem (4K e RAW)</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <Check className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
                  <span>Armazenamento permanente vitalício</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <Check className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
                  <span>Domínio personalizado (i.seusite.com)</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <Check className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
                  <span>Links protegidos por senha</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <Check className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
                  <span>API com 50.000 chamadas/mês</span>
                </li>
              </ul>
            </div>

            {/* Error notice */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-brand-cyan/10 border border-brand-cyan/30 text-[11px] text-brand-cyan">
                {errorMessage}
              </div>
            )}

            {/* Payment Method selector */}
            <div className="flex flex-col gap-2 pt-2 border-t border-dark-border/60">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPayment("card")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedPayment === "card"
                      ? "bg-brand-emerald/20 text-brand-emerald border border-brand-emerald/40"
                      : "bg-dark-card text-dark-muted border border-dark-border"
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Cartão & Apple/Google Pay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPayment("pix")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedPayment === "pix"
                      ? "bg-brand-emerald/20 text-brand-emerald border border-brand-emerald/40"
                      : "bg-dark-card text-dark-muted border border-dark-border"
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>PIX Instantâneo</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-emerald to-emerald-500 hover:from-brand-emeraldLight hover:to-emerald-400 text-dark-bg font-bold text-xs transition-all shadow-lg shadow-brand-emerald/20 hover:shadow-brand-emerald/40 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>Conectando ao Checkout Seguro...</span>
                ) : (
                  <>
                    <span>Ir para Checkout Seguro</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {/* Dev mode simulation button if Stripe keys not yet entered */}
              {showDevFallback && (
                <button
                  type="button"
                  onClick={handleSimulatedUpgrade}
                  className="w-full py-1.5 rounded-xl bg-dark-card hover:bg-dark-surface border border-dark-border text-dark-muted hover:text-dark-text text-[11px] font-medium transition-all"
                >
                  ⚡ Ativar PRO em Modo Demonstração (Sem Chaves)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Security pledge */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-dark-dimmed">
          <Lock className="w-3.5 h-3.5 text-brand-emerald" />
          <span>Checkout criptografado com certificação PCI-DSS Level 1 via Stripe</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { UploadOptions, ExpirationOption, OutputFormat } from "@/types";
import { Clock, Shield, SlidersHorizontal, Image as ImageIcon } from "lucide-react";

interface Props {
  options: UploadOptions;
  onChange: (options: UploadOptions) => void;
}

export default function UploadOptionsBar({ options, onChange }: Props) {
  return (
    <div className="w-full bg-dark-surface/70 border border-dark-border/70 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
      <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-dark-muted">
        <SlidersHorizontal className="w-3.5 h-3.5 text-brand-emerald" />
        <span>Opções Avançadas de Envio & Segurança</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Expiration selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-dark-text font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-brand-amber" />
            Expiração / Autodestruição
          </label>
          <select
            value={options.expiration}
            onChange={(e) =>
              onChange({ ...options, expiration: e.target.value as ExpirationOption })
            }
            className="w-full bg-dark-card border border-dark-border rounded-xl px-3 py-2 text-xs text-dark-text focus:outline-none focus:border-brand-emerald"
          >
            <option value="never">Nunca (Permanente)</option>
            <option value="1h">1 Hora</option>
            <option value="24h">24 Horas (1 Dia)</option>
            <option value="7d">7 Dias (1 Semana)</option>
            <option value="30d">30 Dias (1 Mês)</option>
          </select>
        </div>

        {/* Output format */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-dark-text font-medium flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-brand-cyan" />
            Formato de Saída
          </label>
          <select
            value={options.outputFormat}
            onChange={(e) =>
              onChange({ ...options, outputFormat: e.target.value as OutputFormat })
            }
            className="w-full bg-dark-card border border-dark-border rounded-xl px-3 py-2 text-xs text-dark-text focus:outline-none focus:border-brand-emerald"
          >
            <option value="original">Manter Formato Original</option>
            <option value="webp">WebP (Otimizado p/ Web)</option>
            <option value="avif">AVIF (Máxima Compressão)</option>
            <option value="png">PNG (Sem perda)</option>
            <option value="jpeg">JPEG (Universal)</option>
          </select>
        </div>

        {/* Max dimension resize */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-dark-text font-medium flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-brand-violet" />
            Redimensionamento
          </label>
          <select
            value={options.maxDimension ? String(options.maxDimension) : "original"}
            onChange={(e) => {
              const val = e.target.value;
              onChange({
                ...options,
                maxDimension: val === "original" ? undefined : parseInt(val, 10),
              });
            }}
            className="w-full bg-dark-card border border-dark-border rounded-xl px-3 py-2 text-xs text-dark-text focus:outline-none focus:border-brand-emerald"
          >
            <option value="original">Resolução Original</option>
            <option value="1920">Máx 1920px (Full HD)</option>
            <option value="1280">Máx 1280px (HD 720p)</option>
            <option value="800">Máx 800px (Web / Blog)</option>
          </select>
        </div>

        {/* Strip EXIF Toggle */}
        <div className="flex flex-col justify-end">
          <label
            className="flex items-center gap-3 p-2 rounded-xl bg-dark-card border border-dark-border cursor-pointer hover:border-dark-borderSubtle transition-all select-none"
            title="Remove dados de GPS, câmera e fabricante da foto"
          >
            <input
              type="checkbox"
              checked={options.stripExif}
              onChange={(e) => onChange({ ...options, stripExif: e.target.checked })}
              className="w-4 h-4 rounded text-brand-emerald bg-dark-surface border-dark-border focus:ring-brand-emerald accent-brand-emerald cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="text-xs text-dark-text font-medium flex items-center gap-1">
                <Shield className="w-3 h-3 text-brand-emerald" />
                Limpar EXIF & GPS
              </span>
              <span className="text-[10px] text-dark-muted">Privacidade total</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

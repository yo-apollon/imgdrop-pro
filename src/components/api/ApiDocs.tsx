"use client";

import React, { useState } from "react";
import { Code2, Copy, Check, Terminal, FileJson, Sparkles } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";

export default function ApiDocs() {
  const [activeLang, setActiveLang] = useState<"curl" | "js" | "python">("curl");
  const [copiedLang, setCopiedLang] = useState<string | null>(null);

  const curlSnippet = `# 1. Upload de Imagem local via cURL
curl -X POST https://seudominio.com/api/upload \\
  -F "file=@/caminho/minha-foto.png" \\
  -F "expiration=24h" \\
  -F "outputFormat=webp" \\
  -F "stripExif=true"

# 2. Upload a partir de uma URL remota
curl -X POST https://seudominio.com/api/fetch-url \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://exemplo.com/foto.jpg", "expiration": "7d"}'`;

  const jsSnippet = `// 1. Upload via FormData (Browser ou Node.js 18+)
const formData = new FormData();
formData.append("file", fileInput.files[0]);
formData.append("expiration", "24h"); // "never", "1h", "24h", "7d", "30d"
formData.append("outputFormat", "webp");
formData.append("stripExif", "true");

const response = await fetch("https://seudominio.com/api/upload", {
  method: "POST",
  body: formData,
});

const data = await response.json();
console.log("URL Direta:", data.image.url);
console.log("Markdown:", data.markdown);
console.log("Página de Visualização:", data.image.viewUrl);`;

  const pythonSnippet = `# 1. Upload de arquivo usando requests
import requests

url = "https://seudominio.com/api/upload"
files = {"file": open("foto.jpg", "rb")}
data = {
    "expiration": "24h",
    "outputFormat": "webp",
    "stripExif": "true"
}

response = requests.post(url, files=files, data=data)
result = response.json()

print("URL Direta:", result["image"]["url"])
print("Markdown:", result["markdown"])`;

  const responseJsonSnippet = `{
  "success": true,
  "image": {
    "id": "8kF2qZxY",
    "filename": "screenshot.png",
    "storedFilename": "8kF2qZxY.webp",
    "size": 142580,
    "originalSize": 894100,
    "mimeType": "image/webp",
    "width": 1920,
    "height": 1080,
    "createdAt": "2026-10-26T14:30:00.000Z",
    "expiresAt": "2026-10-27T14:30:00.000Z",
    "url": "https://seudominio.com/uploads/8kF2qZxY.webp",
    "viewUrl": "https://seudominio.com/i/8kF2qZxY",
    "deleteToken": "sec_7a9f...28b"
  },
  "markdown": "![screenshot.png](https://seudominio.com/uploads/8kF2qZxY.webp)",
  "html": "<img src=\\"https://seudominio.com/uploads/8kF2qZxY.webp\\" alt=\\"screenshot.png\\" />",
  "bbcode": "[img]https://seudominio.com/uploads/8kF2qZxY.webp[/img]"
}`;

  const handleCopy = async (id: string, text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedLang(id);
      setTimeout(() => setCopiedLang(null), 2000);
    }
  };

  const getActiveCode = () => {
    switch (activeLang) {
      case "curl":
        return curlSnippet;
      case "js":
        return jsSnippet;
      case "python":
        return pythonSnippet;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 animate-fade-in">
      <div className="text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald text-xs font-mono mb-3">
          <Terminal className="w-3.5 h-3.5" />
          <span>REST API v1 para Desenvolvedores</span>
        </div>
        <h2 className="text-2xl font-bold text-dark-text tracking-tight">
          Integre o ImageToURL em seus Bots, Scripts e Apps
        </h2>
        <p className="text-sm text-dark-muted max-w-lg mt-2">
          Envie imagens diretamente pelo terminal, automatize uploads em Discord bots, Discord webhooks, CI/CD pipelines ou formulários sem complicações.
        </p>
      </div>

      {/* Code Card */}
      <div className="rounded-3xl border border-dark-border bg-dark-card overflow-hidden shadow-2xl">
        {/* Top bar with tabs */}
        <div className="px-4 py-3 bg-dark-surface/90 border-b border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveLang("curl")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                activeLang === "curl"
                  ? "bg-dark-card text-brand-emerald border border-dark-border"
                  : "text-dark-muted hover:text-dark-text"
              }`}
            >
              cURL
            </button>
            <button
              type="button"
              onClick={() => setActiveLang("js")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                activeLang === "js"
                  ? "bg-dark-card text-brand-emerald border border-dark-border"
                  : "text-dark-muted hover:text-dark-text"
              }`}
            >
              JavaScript / TS
            </button>
            <button
              type="button"
              onClick={() => setActiveLang("python")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                activeLang === "python"
                  ? "bg-dark-card text-brand-emerald border border-dark-border"
                  : "text-dark-muted hover:text-dark-text"
              }`}
            >
              Python
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleCopy(activeLang, getActiveCode())}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-card hover:bg-dark-hover border border-dark-border text-xs text-dark-text transition-colors"
          >
            {copiedLang === activeLang ? (
              <>
                <Check className="w-3.5 h-3.5 text-brand-emerald" />
                <span className="text-brand-emerald font-semibold">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Código</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <pre className="p-5 text-xs font-mono text-dark-text overflow-x-auto leading-relaxed bg-[#0d131f]">
          <code>{getActiveCode()}</code>
        </pre>
      </div>

      {/* Response Payload Card */}
      <div className="rounded-3xl border border-dark-border bg-dark-card overflow-hidden shadow-2xl">
        <div className="px-5 py-3.5 bg-dark-surface/90 border-b border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-dark-text">
            <FileJson className="w-4 h-4 text-brand-cyan" />
            <span>Exemplo de Resposta (JSON 200 OK)</span>
          </div>

          <button
            type="button"
            onClick={() => handleCopy("json", responseJsonSnippet)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-dark-card hover:bg-dark-hover border border-dark-border text-xs text-dark-text transition-colors"
          >
            {copiedLang === "json" ? (
              <Check className="w-3.5 h-3.5 text-brand-emerald" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>Copiar JSON</span>
          </button>
        </div>

        <pre className="p-5 text-xs font-mono text-brand-cyan/90 overflow-x-auto leading-relaxed bg-[#0d131f]">
          <code>{responseJsonSnippet}</code>
        </pre>
      </div>
    </div>
  );
}

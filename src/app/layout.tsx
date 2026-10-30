import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "ImgDrop Pro - Hospedagem Rápida & Conversor de Imagens em Links Diretos",
  description:
    "Arraste, solte e gere URLs diretas instantaneamente. Crie links em Markdown, HTML, BBCode e QR Code. 100% gratuito, sem anúncios, com remoção de EXIF e compatível com CDN global.",
  keywords: [
    "imgdrop",
    "image drop",
    "imagem para url",
    "hospedar imagem",
    "gerar link de imagem",
    "upload de imagem direto",
    "markdown image",
    "html image",
    "free image hosting",
  ],
  authors: [{ name: "ImgDrop Pro" }],
  verification: {
    google: "aba5c6d8d6e30aad",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={`${jakarta.variable} ${jetbrains.variable} font-sans bg-dark-bg text-dark-text antialiased min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}

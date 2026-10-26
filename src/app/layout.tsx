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
  title: "ImageToURL Pro - Conversor de Imagens em Links Diretos",
  description:
    "Hospede imagens, converta para URLs diretas, gere links em Markdown, HTML, BBCode e QR Code instantaneamente. Sem anúncios, com remoção de EXIF e alta performance.",
  keywords: [
    "image to url",
    "imagem para url",
    "hospedar imagem",
    "gerar link de imagem",
    "upload de imagem direto",
    "markdown image",
    "html image",
    "free image hosting",
  ],
  authors: [{ name: "ImageToURL Pro" }],
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

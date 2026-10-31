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
  metadataBase: new URL("https://imgdrop-pro.vercel.app"),
  title: {
    default: "ImgDrop Pro - Hospedagem Rápida & Links Diretos",
    template: "%s | ImgDrop Pro",
  },
  description:
    "Hospedagem em nuvem de alta performance com geração de links diretos, Markdown, HTML, BBCode e QR Code. Sem anúncios, com remoção de metadados EXIF e suporte a uploads em lote.",
  keywords: [
    "ImgDrop Pro",
    "ImgDrop",
    "imagem para url",
    "hospedar imagem",
    "gerar link de imagem",
    "upload de imagem direto",
    "markdown image",
    "html image",
    "free image hosting",
    "conversor de imagem",
    "compressor de imagem webp",
  ],
  authors: [{ name: "ImgDrop Pro" }],
  creator: "ImgDrop Pro",
  publisher: "ImgDrop Pro",
  applicationName: "ImgDrop Pro",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://imgdrop-pro.vercel.app",
    siteName: "ImgDrop Pro",
    title: "ImgDrop Pro - Hospedagem Rápida & Links Diretos",
    description:
      "Arraste imagens e gere URLs diretas instantaneamente. Sem anúncios, com remoção de metadados EXIF e CDN de alta performance.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ImgDrop Pro - Hospedagem Rápida & Links Diretos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ImgDrop Pro - Hospedagem Rápida & Links Diretos",
    description:
      "Arraste imagens e gere URLs diretas instantaneamente. Sem anúncios, com remoção de metadados EXIF e CDN de alta performance.",
    images: ["/og-image.png"],
  },
  verification: {
    google: "aba5c6d8d6e30aad",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://imgdrop-pro.vercel.app/#website",
      "url": "https://imgdrop-pro.vercel.app",
      "name": "ImgDrop Pro",
      "alternateName": ["ImgDrop", "ImgDropPro"],
      "description":
        "Hospedagem em nuvem de alta performance com geração de links diretos, Markdown, HTML e BBCode.",
      "inLanguage": "pt-BR",
    },
    {
      "@type": "WebApplication",
      "@id": "https://imgdrop-pro.vercel.app/#webapp",
      "url": "https://imgdrop-pro.vercel.app",
      "name": "ImgDrop Pro",
      "applicationCategory": "MultimediaApplication",
      "operatingSystem": "All",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "BRL",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${jakarta.variable} ${jetbrains.variable} font-sans bg-dark-bg text-dark-text antialiased min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}

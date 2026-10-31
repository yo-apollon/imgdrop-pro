const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 1. High-resolution vector SVG for ImgDrop Pro (Emerald / Cyan Gradient with dark luxury aesthetic)
const svgLogo = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f19" />
      <stop offset="100%" stop-color="#04060a" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="50%" stop-color="#14b8a6" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
    <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#06b6d4" stop-opacity="0" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Base with subtle border -->
  <rect width="512" height="512" rx="128" fill="url(#bgGrad)" />
  <rect x="8" y="8" width="496" height="496" rx="120" stroke="url(#accentGrad)" stroke-width="4" stroke-opacity="0.3" fill="none" />
  
  <!-- Ambient Inner Glow -->
  <circle cx="256" cy="256" r="160" fill="url(#glowGrad)" filter="url(#glow)" />

  <!-- Central Emblem: Stylized Chain Link / Cloud Drop -->
  <g transform="translate(106, 106)" filter="url(#glow)">
    <!-- Top-Right Link Ring -->
    <path d="M175 60 C215 60, 240 85, 240 125 C240 165, 215 190, 175 190 L135 190 C125 190, 115 182, 115 172 C115 162, 125 154, 135 154 L175 154 C195 154, 204 145, 204 125 C204 105, 195 96, 175 96 L135 96 C115 96, 106 105, 106 125 C106 135, 98 143, 88 143 C78 143, 70 135, 70 125 C70 85, 95 60, 135 60 Z" fill="url(#accentGrad)" />

    <!-- Bottom-Left Link Ring -->
    <path d="M125 240 C85 240, 60 215, 60 175 C60 135, 85 110, 125 110 L165 110 C175 110, 185 118, 185 128 C185 138, 175 146, 165 146 L125 146 C105 146, 96 155, 96 175 C96 195, 105 204, 125 204 L165 204 C185 204, 194 195, 194 175 C194 165, 202 157, 212 157 C222 157, 230 165, 230 175 C230 215, 205 240, 165 240 Z" fill="url(#accentGrad)" />

    <!-- Center Connecting Diagonal Beam -->
    <rect x="110" y="142" width="80" height="20" rx="10" transform="rotate(-45 150 152)" fill="#ffffff" />
  </g>
</svg>
`;

// 2. OpenGraph Social Banner SVG (1200x630)
const svgOgBanner = `
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ogBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070a12" />
      <stop offset="100%" stop-color="#030408" />
    </linearGradient>
    <linearGradient id="ogAccent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="50%" stop-color="#2dd4bf" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#ogBg)" />

  <!-- Grid Glow Lines -->
  <circle cx="200" cy="200" r="300" fill="#10b981" fill-opacity="0.08" />
  <circle cx="1000" cy="400" r="350" fill="#06b6d4" fill-opacity="0.08" />

  <!-- Logo Icon Container -->
  <rect x="100" y="140" width="100" height="100" rx="28" fill="#0b0f19" stroke="#10b981" stroke-width="2" stroke-opacity="0.4" />
  <path d="M135 190 C125 190, 120 180, 120 170 C120 160, 125 150, 135 150 L150 150 M165 190 L180 190 C190 190, 195 180, 195 170 C195 160, 190 150, 180 150 L165 150 M140 170 L175 170" stroke="url(#ogAccent)" stroke-width="6" stroke-linecap="round" />

  <!-- Pill Badge -->
  <rect x="220" y="170" width="130" height="32" rx="16" fill="#10b981" fill-opacity="0.12" stroke="#10b981" stroke-opacity="0.3" />
  <text x="240" y="191" fill="#10b981" font-family="system-ui, sans-serif" font-size="13" font-weight="700" letter-spacing="1">IMGDROP PRO</text>

  <!-- Main Headline -->
  <text x="100" y="310" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="56" font-weight="800" letter-spacing="-1">
    Hospedagem Rápida &amp; Links Diretos
  </text>
  <text x="100" y="375" fill="url(#ogAccent)" font-family="system-ui, sans-serif" font-size="48" font-weight="800" letter-spacing="-1">
    Sem Anúncios. Seguro. Instantâneo.
  </text>

  <!-- Subtitle -->
  <text x="100" y="445" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="22" font-weight="400">
    Arraste imagens e gere URLs diretas, Markdown, HTML, BBCode e QR Code na hora.
  </text>
  <text x="100" y="480" fill="#64748b" font-family="system-ui, sans-serif" font-size="18" font-weight="400">
    Compressor local em tempo real • Limpeza de metadados EXIF &amp; GPS • API REST
  </text>

  <!-- Bottom Badges -->
  <rect x="100" y="525" width="150" height="34" rx="8" fill="#1e293b" />
  <text x="120" y="547" fill="#cbd5e1" font-family="monospace" font-size="13">✓ Até 50MB</text>

  <rect x="265" y="525" width="180" height="34" rx="8" fill="#1e293b" />
  <text x="285" y="547" fill="#cbd5e1" font-family="monospace" font-size="13">✓ CDN Global Rápido</text>

  <rect x="460" y="525" width="180" height="34" rx="8" fill="#1e293b" />
  <text x="480" y="547" fill="#cbd5e1" font-family="monospace" font-size="13">✓ 100% Sem Anúncios</text>
</svg>
`;

async function generateAssets() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Write SVG
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgLogo.trim());
  console.log('✅ favicon.svg gerado');

  // 2. Generate icon.png (512x512)
  const iconBuffer = await sharp(Buffer.from(svgLogo))
    .resize(512, 512)
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'icon.png'), iconBuffer);
  console.log('✅ icon.png (512x512) gerado');

  // 3. Generate apple-touch-icon.png (180x180)
  await sharp(Buffer.from(svgLogo))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✅ apple-touch-icon.png (180x180) gerado');

  // 4. Generate favicon-32x32.png
  await sharp(Buffer.from(svgLogo))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('✅ favicon-32x32.png gerado');

  // 5. Generate favicon-16x16.png
  await sharp(Buffer.from(svgLogo))
    .resize(16, 16)
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));
  console.log('✅ favicon-16x16.png gerado');

  // 6. Generate favicon.ico (compatível com 48x48 para Google Search Favicon)
  const ico48Buffer = await sharp(Buffer.from(svgLogo))
    .resize(48, 48)
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico48Buffer);
  console.log('✅ favicon.ico (48x48) gerado');

  // 7. Generate og-image.png (1200x630)
  await sharp(Buffer.from(svgOgBanner))
    .resize(1200, 630)
    .png()
    .toFile(path.join(publicDir, 'og-image.png'));
  console.log('✅ og-image.png (1200x630) gerado');
}

generateAssets().catch(console.error);

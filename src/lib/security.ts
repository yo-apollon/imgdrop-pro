// 1. SVG Sanitization to eliminate Stored XSS without heavy jsdom/ESM dependencies
export function sanitizeSvg(svgContent: string): string {
  let clean = svgContent;

  // Remove XML/HTML comments that might mask exploits
  clean = clean.replace(/<!--[\s\S]*?-->/gi, "");

  // Remove <script> tags and any contents
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script\s*>/gi, "");

  // Remove dangerous tags
  const forbiddenTags = [
    "script",
    "iframe",
    "object",
    "embed",
    "link",
    "form",
    "input",
    "base",
    "meta",
    "applet",
  ];

  for (const tag of forbiddenTags) {
    const blockReg = new RegExp(`<\\s*${tag}\\b[^>]*>[\\s\\S]*?<\\/\\s*${tag}\\s*>`, "gi");
    clean = clean.replace(blockReg, "");
    const singleReg = new RegExp(`<\\s*${tag}\\b[^>]*\\/?>`, "gi");
    clean = clean.replace(singleReg, "");
  }

  // Remove all inline DOM event handlers (e.g. onload, onerror, onclick, onmouseover)
  clean = clean.replace(/\s+on[a-zA-Z]+\s*=\s*(?:["'][^"']*["']|[^\s>]+)/gi, "");

  // Remove javascript: and data: schemes inside href, xlink:href, or action
  clean = clean.replace(/(?:href|xlink:href|action)\s*=\s*["']\s*(?:javascript|data):[^"']*["']/gi, "");

  return clean;
}

// 2. SSRF Blocker: Prevent requests to local addresses or cloud metadata IPs
export function isSafeRemoteUrl(urlString: string): { safe: boolean; reason?: string } {
  try {
    const parsed = new URL(urlString);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { safe: false, reason: "Apenas protocolos HTTP e HTTPS são permitidos." };
    }

    const host = parsed.hostname.toLowerCase();

    // Block localhost and internal names
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host === "0.0.0.0" ||
      host.endsWith(".local") ||
      host.endsWith(".internal")
    ) {
      return { safe: false, reason: "Acesso a endereços locais não é permitido." };
    }

    // Block AWS / GCP / Azure metadata endpoint
    if (host === "169.254.169.254") {
      return { safe: false, reason: "Acesso a endereços de metadados de nuvem bloqueado." };
    }

    // Block IPv4 private ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = host.match(ipv4Regex);
    if (match) {
      const b1 = parseInt(match[1], 10);
      const b2 = parseInt(match[2], 10);

      // 10.0.0.0 - 10.255.255.255
      if (b1 === 10) return { safe: false, reason: "IP privado bloqueado (10.0.0.0/8)." };
      // 172.16.0.0 - 172.31.255.255
      if (b1 === 172 && b2 >= 16 && b2 <= 31) return { safe: false, reason: "IP privado bloqueado (172.16.0.0/12)." };
      // 192.168.0.0 - 192.168.255.255
      if (b1 === 192 && b2 === 168) return { safe: false, reason: "IP privado bloqueado (192.168.0.0/16)." };
      // Loopback
      if (b1 === 127) return { safe: false, reason: "Loopback bloqueado." };
    }

    return { safe: true };
  } catch {
    return { safe: false, reason: "Formato de URL inválido." };
  }
}

// 3. Lightweight IP Rate Limiter (Sliding Window in-memory)
interface RateLimitRecord {
  timestamps: number[];
}

const ipMap = new Map<string, RateLimitRecord>();

export function checkRateLimit(
  ip: string,
  limit: number = 60,
  windowMs: number = 10 * 60 * 1000 // 10 minutes
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = ipMap.get(ip) || { timestamps: [] };

  // Filter out timestamps outside window
  const validTimestamps = record.timestamps.filter((t) => now - t < windowMs);

  if (validTimestamps.length >= limit) {
    ipMap.set(ip, { timestamps: validTimestamps });
    return { allowed: false, remaining: 0 };
  }

  validTimestamps.push(now);
  ipMap.set(ip, { timestamps: validTimestamps });

  // Periodically trim old entries if map gets too large
  if (ipMap.size > 5000) {
    for (const [key, val] of ipMap.entries()) {
      if (val.timestamps.every((t) => now - t >= windowMs)) {
        ipMap.delete(key);
      }
    }
  }

  return { allowed: true, remaining: limit - validTimestamps.length };
}

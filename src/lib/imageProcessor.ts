import { ExifInfo, OutputFormat } from "@/types";

export interface ProcessImageOptions {
  stripExif?: boolean;
  outputFormat?: OutputFormat;
  quality?: number;
  maxDimension?: number;
}

export interface ProcessedImageResult {
  buffer: Buffer;
  mimeType: string;
  extension: string;
  width: number;
  height: number;
  size: number;
  exifPreview?: ExifInfo;
}

// Lazy loader for sharp with graceful fallback
let sharpModule: any = null;
let sharpLoadFailed = false;

async function getSharpInstance(): Promise<any> {
  if (sharpModule) return sharpModule;
  if (sharpLoadFailed) return null;

  try {
    const mod = await import("sharp");
    sharpModule = (mod as any).default || mod;
    return sharpModule;
  } catch (err) {
    console.warn("Sharp native module could not be loaded, using binary sniff fallback:", err);
    sharpLoadFailed = true;
    return null;
  }
}

// Format sniffer for when sharp is absent or processing is bypassed
function sniffImageFormat(buffer: Buffer): { mimeType: string; extension: string } {
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { mimeType: "image/png", extension: "png" };
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: "image/jpeg", extension: "jpg" };
  }
  if (buffer.length >= 6 && buffer.toString("ascii", 0, 3) === "GIF") {
    return { mimeType: "image/gif", extension: "gif" };
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return { mimeType: "image/webp", extension: "webp" };
  }
  if (buffer.toString("utf-8", 0, Math.min(buffer.length, 100)).includes("<svg")) {
    return { mimeType: "image/svg+xml", extension: "svg" };
  }
  return { mimeType: "image/png", extension: "png" };
}

export async function extractExifInfo(buffer: Buffer): Promise<ExifInfo> {
  try {
    const sharp = await getSharpInstance();
    if (!sharp) return {};

    const image = sharp(buffer);
    const meta = await image.metadata();

    const info: ExifInfo = {
      format: meta.format,
      width: meta.width,
      height: meta.height,
      space: meta.space,
      channels: meta.channels,
      depth: meta.depth,
      density: meta.density,
      hasProfile: meta.hasProfile,
      hasAlpha: meta.hasAlpha,
      orientation: meta.orientation,
    };

    if (meta.exif) {
      info.software = "Exif metadata detected";
    }

    return info;
  } catch (err) {
    console.error("Error reading metadata:", err);
    return {};
  }
}

export async function processImage(
  inputBuffer: Buffer,
  options: ProcessImageOptions = {}
): Promise<ProcessedImageResult> {
  const {
    stripExif = true,
    outputFormat = "original",
    quality = 85,
    maxDimension,
  } = options;

  const sharp = await getSharpInstance();

  // If sharp is unavailable, pass-through safely
  if (!sharp) {
    const sniffed = sniffImageFormat(inputBuffer);
    return {
      buffer: inputBuffer,
      mimeType: sniffed.mimeType,
      extension: sniffed.extension,
      width: 1200,
      height: 800,
      size: inputBuffer.length,
    };
  }

  try {
    let image = sharp(inputBuffer, { failOn: "none", animated: true });
    const initialMeta = await image.metadata();

    // If user does NOT want to strip EXIF, we preserve it. By default, Sharp strips EXIF unless withMetadata() is called.
    if (!stripExif) {
      image = image.withMetadata();
    }

    // Handle resizing if requested
    if (
      maxDimension &&
      ((initialMeta.width && initialMeta.width > maxDimension) ||
        (initialMeta.height && initialMeta.height > maxDimension))
    ) {
      image = image.resize({
        width: maxDimension,
        height: maxDimension,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    let targetFormat = outputFormat;
    let targetMime = "image/webp";
    let targetExt = "webp";

    if (targetFormat === "original") {
      const orig = initialMeta.format || "webp";
      switch (orig) {
        case "jpeg":
        case "jpg":
          targetFormat = "jpeg";
          targetMime = "image/jpeg";
          targetExt = "jpg";
          break;
        case "png":
          targetFormat = "png";
          targetMime = "image/png";
          targetExt = "png";
          break;
        case "gif":
          targetFormat = "gif" as OutputFormat;
          targetMime = "image/gif";
          targetExt = "gif";
          break;
        case "avif":
          targetFormat = "avif";
          targetMime = "image/avif";
          targetExt = "avif";
          break;
        case "svg":
          targetFormat = "original";
          targetMime = "image/svg+xml";
          targetExt = "svg";
          break;
        default:
          targetFormat = "webp";
          targetMime = "image/webp";
          targetExt = "webp";
      }
    }

    // Handle SVG directly without re-rasterizing
    if (initialMeta.format === "svg" && outputFormat === "original") {
      return {
        buffer: inputBuffer,
        mimeType: "image/svg+xml",
        extension: "svg",
        width: initialMeta.width || 800,
        height: initialMeta.height || 600,
        size: inputBuffer.length,
      };
    }

    // Handle GIF animations if original is requested
    if (initialMeta.format === "gif" && targetFormat === ("gif" as OutputFormat)) {
      const outBuf = await image.gif().toBuffer();
      return {
        buffer: outBuf,
        mimeType: "image/gif",
        extension: "gif",
        width: initialMeta.width || 0,
        height: initialMeta.height || 0,
        size: outBuf.length,
      };
    }

    // Convert to specific formats
    switch (targetFormat) {
      case "webp":
        image = image.webp({ quality, effort: 4 });
        targetMime = "image/webp";
        targetExt = "webp";
        break;
      case "avif":
        image = image.avif({ quality: Math.max(quality - 10, 50), effort: 4 });
        targetMime = "image/avif";
        targetExt = "avif";
        break;
      case "jpeg":
        image = image.jpeg({ quality, mozjpeg: true });
        targetMime = "image/jpeg";
        targetExt = "jpg";
        break;
      case "png":
        image = image.png({ compressionLevel: 8 });
        targetMime = "image/png";
        targetExt = "png";
        break;
      default:
        image = image.webp({ quality });
        targetMime = "image/webp";
        targetExt = "webp";
    }

    const outputBuffer = await image.toBuffer();
    const finalMeta = await sharp(outputBuffer).metadata();

    return {
      buffer: outputBuffer,
      mimeType: targetMime,
      extension: targetExt,
      width: finalMeta.width || initialMeta.width || 0,
      height: finalMeta.height || initialMeta.height || 0,
      size: outputBuffer.length,
    };
  } catch (err) {
    console.warn("Sharp processing error, falling back to original buffer:", err);
    const sniffed = sniffImageFormat(inputBuffer);
    return {
      buffer: inputBuffer,
      mimeType: sniffed.mimeType,
      extension: sniffed.extension,
      width: 1200,
      height: 800,
      size: inputBuffer.length,
    };
  }
}

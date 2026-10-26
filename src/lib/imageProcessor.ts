import sharp from "sharp";
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

export async function extractExifInfo(buffer: Buffer): Promise<ExifInfo> {
  try {
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
      // Basic raw exif presence
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

  let image = sharp(inputBuffer, { failOn: "none", animated: true });
  const initialMeta = await image.metadata();

  // If user does NOT want to strip EXIF, we preserve it. By default, Sharp strips EXIF unless withMetadata() is called.
  if (!stripExif) {
    image = image.withMetadata();
  }

  // Handle resizing if requested
  if (maxDimension && ((initialMeta.width && initialMeta.width > maxDimension) || (initialMeta.height && initialMeta.height > maxDimension))) {
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

  // Handle SVG directly if format is SVG without re-rasterizing
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
    // Preserve gif
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
}

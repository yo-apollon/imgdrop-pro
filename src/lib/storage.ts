import fs from "fs";
import path from "path";
import { UploadedImageMetadata } from "@/types";
import { put as vercelBlobPut, del as vercelBlobDel } from "@vercel/blob";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// Directories for local fallback (uses /tmp on Vercel serverless)
const UPLOADS_DIR = process.env.VERCEL
  ? path.join("/tmp", "uploads")
  : path.join(process.cwd(), "public", "uploads");

const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "data")
  : path.join(process.cwd(), "src", "data");

const METADATA_FILE = path.join(DATA_DIR, "metadata.json");

// In-memory cache for buffers and metadata
const memoryStore = new Map<string, UploadedImageMetadata>();
const bufferCache = new Map<string, Buffer>();

// Helper to get any available Vercel Blob token
function getBlobToken(): string | undefined {
  const tokenKey = Object.keys(process.env).find((k) => k.endsWith("READ_WRITE_TOKEN"));
  return tokenKey ? process.env[tokenKey] : undefined;
}

// Detect active storage provider
export function getActiveStorageProvider(): "vercel-blob" | "r2" | "local" {
  if (getBlobToken()) {
    return "vercel-blob";
  }
  if (
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    process.env.R2_ENDPOINT
  ) {
    return "r2";
  }
  return "local";
}

function ensureLocalDirs() {
  if (typeof window !== "undefined") return;
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(METADATA_FILE)) {
      fs.writeFileSync(METADATA_FILE, JSON.stringify([], null, 2), "utf-8");
    }
  } catch {
    // Ignore errors
  }
}

export function getAllMetadata(): UploadedImageMetadata[] {
  ensureLocalDirs();
  const list: UploadedImageMetadata[] = [];

  for (const item of memoryStore.values()) {
    list.push(item);
  }

  try {
    if (fs.existsSync(METADATA_FILE)) {
      const raw = fs.readFileSync(METADATA_FILE, "utf-8");
      const diskList: UploadedImageMetadata[] = JSON.parse(raw);
      for (const item of diskList) {
        if (!list.some((x) => x.id === item.id)) {
          list.push(item);
        }
      }
    }
  } catch (err) {
    // Ignore
  }

  return list;
}

export function getMetadataById(id: string): UploadedImageMetadata | null {
  if (memoryStore.has(id)) {
    return memoryStore.get(id)!;
  }
  const all = getAllMetadata();
  const found = all.find((item) => item.id === id);
  if (found) {
    memoryStore.set(id, found);
    return found;
  }
  return null;
}

export function saveAllMetadata(data: UploadedImageMetadata[]) {
  for (const item of data) {
    memoryStore.set(item.id, item);
  }

  ensureLocalDirs();
  try {
    fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // Ignore
  }
}

export function getCachedBuffer(storedFilename: string): Buffer | null {
  if (bufferCache.has(storedFilename)) {
    return bufferCache.get(storedFilename)!;
  }
  ensureLocalDirs();
  const filePath = path.join(UPLOADS_DIR, storedFilename);
  if (fs.existsSync(filePath)) {
    try {
      return fs.readFileSync(filePath);
    } catch {
      return null;
    }
  }
  return null;
}

export async function saveUploadedFile(
  id: string,
  buffer: Buffer,
  extension: string,
  metaPartial: Omit<UploadedImageMetadata, "url" | "viewUrl" | "storedFilename" | "storageProvider">
): Promise<UploadedImageMetadata> {
  const provider = getActiveStorageProvider();
  const storedFilename = `${id}.${extension}`;
  let directUrl = `/uploads/${storedFilename}`;
  const viewUrl = `/i/${id}`;

  // Always cache buffer in memory and local/tmp disk
  bufferCache.set(storedFilename, buffer);
  ensureLocalDirs();
  try {
    const filePath = path.join(UPLOADS_DIR, storedFilename);
    fs.writeFileSync(filePath, buffer);
  } catch (e) {
    console.warn("Could not write file to local disk:", e);
  }

  if (provider === "vercel-blob") {
    try {
      const token = getBlobToken();
      const blob = await vercelBlobPut(`uploads/${storedFilename}`, buffer, {
        access: "public",
        ...(token ? { token } : {}),
        contentType: metaPartial.mimeType,
        addRandomSuffix: false,
      });
      directUrl = blob.url;
    } catch (blobErr: any) {
      console.warn("Vercel Blob upload failed, serving via dynamic route:", blobErr?.message);
      // Fallback: serves via /uploads/filename
      directUrl = `/uploads/${storedFilename}`;
    }
  } else if (provider === "r2") {
    try {
      const s3 = new S3Client({
        region: "auto",
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      });

      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: `uploads/${storedFilename}`,
          Body: buffer,
          ContentType: metaPartial.mimeType,
        })
      );

      const publicDomain =
        process.env.R2_PUBLIC_URL ||
        `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}`;
      directUrl = `${publicDomain}/uploads/${storedFilename}`;
    } catch (r2Err) {
      console.warn("R2 upload failed, serving via dynamic route:", r2Err);
      directUrl = `/uploads/${storedFilename}`;
    }
  }

  const record: UploadedImageMetadata = {
    ...metaPartial,
    storedFilename,
    url: directUrl,
    viewUrl,
    storageProvider: provider,
  };

  memoryStore.set(id, record);

  const all = getAllMetadata();
  const updated = [record, ...all.filter((x) => x.id !== id)];
  saveAllMetadata(updated);

  return record;
}

export function registerDirectBlobUpload(
  meta: Omit<UploadedImageMetadata, "viewUrl" | "storageProvider">
): UploadedImageMetadata {
  const record: UploadedImageMetadata = {
    ...meta,
    viewUrl: `/i/${meta.id}`,
    storageProvider: "vercel-blob",
  };

  memoryStore.set(record.id, record);

  const all = getAllMetadata();
  const updated = [record, ...all.filter((x) => x.id !== record.id)];
  saveAllMetadata(updated);

  return record;
}

export async function deleteImage(id: string, deleteToken?: string): Promise<boolean> {
  const item = getMetadataById(id);
  if (!item) return false;

  if (deleteToken && item.deleteToken !== deleteToken) {
    return false;
  }

  bufferCache.delete(item.storedFilename);

  const provider = item.storageProvider || getActiveStorageProvider();

  if (provider === "vercel-blob" && item.url.startsWith("http")) {
    try {
      const token = getBlobToken();
      await vercelBlobDel(item.url, ...(token ? [{ token }] : []));
    } catch (err) {
      console.error("Error deleting from Vercel Blob:", err);
    }
  }

  const filePath = path.join(UPLOADS_DIR, item.storedFilename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      // Ignore
    }
  }

  memoryStore.delete(id);
  const all = getAllMetadata();
  saveAllMetadata(all.filter((x) => x.id !== id));

  return true;
}

export function cleanExpiredImages(): { cleanedCount: number } {
  const all = getAllMetadata();
  const now = new Date().getTime();

  let cleanedCount = 0;
  for (const item of all) {
    if (item.expiresAt && new Date(item.expiresAt).getTime() <= now) {
      deleteImage(item.id, item.deleteToken);
      cleanedCount++;
    }
  }

  return { cleanedCount };
}

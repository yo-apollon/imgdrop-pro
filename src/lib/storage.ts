import fs from "fs";
import path from "path";
import { UploadedImageMetadata } from "@/types";
import { put as vercelBlobPut, del as vercelBlobDel } from "@vercel/blob";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// Directories for local fallback
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const DATA_DIR = path.join(process.cwd(), "src", "data");
const METADATA_FILE = path.join(DATA_DIR, "metadata.json");

// In-memory cache for metadata when running on read-only serverless
const memoryStore = new Map<string, UploadedImageMetadata>();

// Helper to get any available Vercel Blob token
function getBlobToken(): string | undefined {
  const tokenKey = Object.keys(process.env).find((k) => k.endsWith("READ_WRITE_TOKEN"));
  return tokenKey ? process.env[tokenKey] : undefined;
}

// Detect active storage provider
export function getActiveStorageProvider(): "vercel-blob" | "r2" | "local" {
  if (
    process.env.BLOB_READ_WRITE_TOKEN ||
    process.env.BLOB_STORE_ID ||
    process.env.VERCEL_OIDC_TOKEN ||
    process.env.VERCEL
  ) {
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
    // Ignore read-only errors in serverless environments
  }
}

export function getAllMetadata(): UploadedImageMetadata[] {
  ensureLocalDirs();
  const list: UploadedImageMetadata[] = [];

  // 1. In-memory
  for (const item of memoryStore.values()) {
    list.push(item);
  }

  // 2. Disk if readable
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
    // Read-only filesystem in Vercel
  }

  return list;
}

export function getMetadataById(id: string): UploadedImageMetadata | null {
  // Check memory first
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
  // Always update memory
  for (const item of data) {
    memoryStore.set(item.id, item);
  }

  // Attempt to persist to disk if not in read-only environment
  ensureLocalDirs();
  try {
    fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // Serverless read-only filesystem
  }
}

// Upload file implementation across providers
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

  if (provider === "vercel-blob") {
    // 1. VERCEL BLOB STORAGE (OIDC or Token)
    const token = getBlobToken();
    const blob = await vercelBlobPut(`uploads/${storedFilename}`, buffer, {
      access: "public",
      ...(token ? { token } : {}),
      contentType: metaPartial.mimeType,
      addRandomSuffix: false,
    });
    directUrl = blob.url;
  } else if (provider === "r2") {
    // 2. CLOUDFLARE R2 STORAGE
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

    const publicDomain = process.env.R2_PUBLIC_URL || `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}`;
    directUrl = `${publicDomain}/uploads/${storedFilename}`;
  } else {
    // 3. LOCAL DISK STORAGE
    ensureLocalDirs();
    const filePath = path.join(UPLOADS_DIR, storedFilename);
    try {
      fs.writeFileSync(filePath, buffer);
    } catch (e) {
      console.warn("Could not write file to local disk (likely serverless):", e);
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

export async function deleteImage(id: string, deleteToken?: string): Promise<boolean> {
  const item = getMetadataById(id);
  if (!item) return false;

  if (deleteToken && item.deleteToken !== deleteToken) {
    return false;
  }

  const provider = item.storageProvider || getActiveStorageProvider();

  if (provider === "vercel-blob" && item.url.startsWith("http")) {
    try {
      await vercelBlobDel(item.url);
    } catch (err) {
      console.error("Error deleting from Vercel Blob:", err);
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
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: `uploads/${item.storedFilename}`,
        })
      );
    } catch (err) {
      console.error("Error deleting from R2:", err);
    }
  } else {
    // Local
    const filePath = path.join(UPLOADS_DIR, item.storedFilename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Error deleting local file:", err);
      }
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

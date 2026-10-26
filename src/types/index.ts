export type ExpirationOption = "never" | "1h" | "24h" | "7d" | "30d";

export type OutputFormat = "original" | "webp" | "png" | "jpeg" | "avif";

export interface UploadOptions {
  expiration: ExpirationOption;
  outputFormat: OutputFormat;
  stripExif: boolean;
  maxDimension?: number;
  quality?: number;
  isPasswordProtected?: boolean;
  password?: string;
}

export interface UploadedImageMetadata {
  id: string;              // unique slug e.g. '8kF2qZ'
  filename: string;        // original filename
  storedFilename: string;  // name in storage
  size: number;            // in bytes
  originalSize: number;    // original size in bytes
  mimeType: string;        // e.g. 'image/webp'
  width: number;
  height: number;
  createdAt: string;       // ISO timestamp
  expiresAt: string | null;// ISO timestamp or null
  url: string;             // direct public URL
  viewUrl: string;         // pretty preview page URL
  deleteToken: string;     // secret token to delete this specific image
  views?: number;          // view analytics
  userId?: string | null;  // owner user id if logged in
  storageProvider?: "local" | "vercel-blob" | "r2";
}

export interface UploadQueueItem {
  id: string;
  file?: File;
  sourceUrl?: string;
  previewUrl: string;
  name: string;
  size: number;
  progress: number;
  status: "idle" | "uploading" | "success" | "error";
  errorMessage?: string;
  result?: UploadedImageMetadata;
}

export interface ExifInfo {
  format?: string;
  width?: number;
  height?: number;
  space?: string;
  channels?: number;
  depth?: string;
  density?: number;
  hasProfile?: boolean;
  hasAlpha?: boolean;
  orientation?: number;
  make?: string;
  model?: string;
  iso?: number;
  fNumber?: number;
  exposureTime?: string;
  focalLength?: string;
  lensModel?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  createDate?: string;
  software?: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  plan: "free" | "pro";
  apiKey: string;
  createdAt: string;
  totalUploads: number;
  storageUsedBytes: number;
}

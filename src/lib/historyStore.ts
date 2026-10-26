import { UploadedImageMetadata } from "@/types";

const HISTORY_STORAGE_KEY = "imagetourl_history_v1";

export function getLocalHistory(): UploadedImageMetadata[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading local history:", err);
    return [];
  }
}

export function saveToLocalHistory(item: UploadedImageMetadata) {
  if (typeof window === "undefined") return;
  try {
    const history = getLocalHistory();
    // Prepend and filter duplicates
    const updated = [item, ...history.filter((x) => x.id !== item.id)];
    // Cap at 100 items
    const capped = updated.slice(0, 100);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(capped));
    // Dispatch custom event so other components update synchronously
    window.dispatchEvent(new Event("local-history-updated"));
  } catch (err) {
    console.error("Error saving to local history:", err);
  }
}

export function removeFromLocalHistory(id: string) {
  if (typeof window === "undefined") return;
  try {
    const history = getLocalHistory();
    const updated = history.filter((x) => x.id !== id);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("local-history-updated"));
  } catch (err) {
    console.error("Error removing from local history:", err);
  }
}

export function clearLocalHistory() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    window.dispatchEvent(new Event("local-history-updated"));
  } catch (err) {
    console.error("Error clearing local history:", err);
  }
}

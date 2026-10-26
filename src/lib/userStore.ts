import { UserAccount } from "@/types";
import { generateShortId } from "./utils";

const USER_STORAGE_KEY = "imagetourl_user_session_v1";

export function getCurrentUser(): UserAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveUserSession(user: UserAccount) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event("user-auth-changed"));
  } catch (e) {
    console.error("Error saving user session:", e);
  }
}

export function logoutUser() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
    window.dispatchEvent(new Event("user-auth-changed"));
  } catch (e) {
    console.error("Error during logout:", e);
  }
}

export function loginMockUser(email: string, name: string): UserAccount {
  const user: UserAccount = {
    id: `usr_${generateShortId(10)}`,
    email,
    name,
    plan: "free",
    apiKey: `itu_live_${generateShortId(28)}`,
    createdAt: new Date().toISOString(),
    totalUploads: 0,
    storageUsedBytes: 0,
  };
  saveUserSession(user);
  return user;
}

export function upgradeUserToPro(): UserAccount | null {
  const current = getCurrentUser();
  if (!current) return null;
  const updated: UserAccount = {
    ...current,
    plan: "pro",
  };
  saveUserSession(updated);
  return updated;
}

export function regenerateApiKey(): string {
  const current = getCurrentUser();
  if (!current) return "";
  const newKey = `itu_live_${generateShortId(28)}`;
  const updated: UserAccount = {
    ...current,
    apiKey: newKey,
  };
  saveUserSession(updated);
  return newKey;
}

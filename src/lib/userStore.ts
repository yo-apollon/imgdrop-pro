import { UserAccount } from "@/types";
import { generateShortId } from "./utils";
import { createClient } from "./supabase/client";

const USER_STORAGE_KEY = "imgdrop_user_session_v2";

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

export async function logoutUser() {
  if (typeof window === "undefined") return;
  try {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(USER_STORAGE_KEY);
    window.dispatchEvent(new Event("user-auth-changed"));
  } catch (e) {
    console.error("Error during logout:", e);
  }
}

export function upgradeUserToPro(): UserAccount | null {
  const current = getCurrentUser();
  if (!current) return null;
  const updated: UserAccount = {
    ...current,
    plan: "pro",
  };
  saveUserSession(updated);

  // Sync to supabase if connected
  const supabase = createClient();
  if (supabase) {
    supabase
      .from("profiles")
      .update({ plan: "pro" })
      .eq("id", current.id)
      .then();
  }

  return updated;
}

export async function regenerateApiKey(): Promise<string> {
  const current = getCurrentUser();
  if (!current) return "";
  const newKey = `itu_live_${generateShortId(28)}`;
  const updated: UserAccount = {
    ...current,
    apiKey: newKey,
  };
  saveUserSession(updated);

  // Sync to supabase if connected
  const supabase = createClient();
  if (supabase) {
    await supabase
      .from("profiles")
      .update({ api_key: newKey })
      .eq("id", current.id);
  }

  return newKey;
}

// Map a Supabase user and profile to our UserAccount format
export function mapSupabaseToUserAccount(
  authUser: any,
  profile?: any
): UserAccount {
  const fallbackKey = `itu_live_${generateShortId(28)}`;
  return {
    id: authUser.id,
    email: authUser.email || "",
    name:
      profile?.full_name ||
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      authUser.email?.split("@")[0] ||
      "Usuário",
    plan: profile?.plan || "free",
    apiKey: profile?.api_key || fallbackKey,
    createdAt: authUser.created_at || new Date().toISOString(),
    totalUploads: 0,
    storageUsedBytes: 0,
  };
}

// Sync with Supabase on app boot
export async function syncSupabaseSession(): Promise<UserAccount | null> {
  if (typeof window === "undefined") return null;

  const supabase = createClient();
  if (!supabase) {
    return getCurrentUser();
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      // If no supabase session, keep local if not supabase-backed
      return getCurrentUser();
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    const userAccount = mapSupabaseToUserAccount(session.user, profile);
    saveUserSession(userAccount);
    return userAccount;
  } catch (err) {
    console.error("Supabase session sync error:", err);
    return getCurrentUser();
  }
}

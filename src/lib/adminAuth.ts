// ─────────────────────────────────────────────────────────────────────────────
//  Central admin credentials store
//  Replace with a real backend / hashed passwords when going to production.
// ─────────────────────────────────────────────────────────────────────────────

export type AdminProfile = {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
  avatarInitial: string; // derived from name
  avatar: string;        // base64 profile picture (empty = use initial)
};

const AVATAR_KEY = "brightocity_admin_avatar";

// Single mutable object – lives for the lifetime of the browser session.
export const adminProfile: AdminProfile = {
  name: "Admin User",
  email: "admin@brightocity.com",
  password: "admin123",
  phone: "+1 555-0100",
  role: "Super Administrator",
  avatarInitial: "A",
  avatar: "",
};

export function updateAdminProfile(patch: Partial<Omit<AdminProfile, "avatarInitial">>) {
  Object.assign(adminProfile, patch);
  if (patch.name) {
    adminProfile.avatarInitial = patch.name.trim().charAt(0).toUpperCase() || "A";
  }
  if (patch.avatar !== undefined) {
    // Persist avatar across page refreshes via localStorage
    if (typeof window !== "undefined") {
      if (patch.avatar) localStorage.setItem(AVATAR_KEY, patch.avatar);
      else localStorage.removeItem(AVATAR_KEY);
    }
  }
}

/** Load persisted avatar from localStorage into adminProfile (call once on app start). */
export function loadPersistedAvatar() {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(AVATAR_KEY);
    if (saved) adminProfile.avatar = saved;
  }
}

/** Generate a random 6-digit OTP string */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

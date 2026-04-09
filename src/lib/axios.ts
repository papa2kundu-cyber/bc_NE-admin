import axios from "axios";

const TOKEN_KEY = "brightocity_auth_token";
const USER_KEY = "brightocity_auth_user";

export interface StoredUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export const apiClient = axios.create({
  baseURL: "https://brightocityinterior.com/backend/api",
  headers: {
    "Accept": "application/json",
  },
});

// Attach Bearer token from localStorage on every request
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 globally — clear both token and user
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    return Promise.reject(error);
  }
);

// ── Token helpers ────────────────────────────────────────────────────────────
export const setAuthToken = (token: string) => {
  if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
};

export const clearAuthToken = () => {
  if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
};

export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

// ── User helpers ─────────────────────────────────────────────────────────────
export const setStoredUser = (user: StoredUser) => {
  if (typeof window !== "undefined")
    localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getStoredUser = (): StoredUser | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
};

export const clearStoredUser = () => {
  if (typeof window !== "undefined") localStorage.removeItem(USER_KEY);
};

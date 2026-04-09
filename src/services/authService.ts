import { apiClient, setAuthToken, clearAuthToken, setStoredUser, clearStoredUser } from "@/lib/axios";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export const authService = {
  register: async (data: RegisterPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/register", data);
    if (response.data.token) {
      setAuthToken(response.data.token);
    }
    return response.data;
  },

  login: async (data: LoginPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/login", data);
    if (response.data.token) {
      setAuthToken(response.data.token);
    }
    if (response.data.user) {
      setStoredUser(response.data.user);
    }
    return response.data;
  },

  logout: () => {
    clearAuthToken();
    clearStoredUser();
  },
};

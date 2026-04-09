import { apiClient } from "@/lib/axios";

export interface ContactPayload {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export interface ContactResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  created_at?: string;
}

export const contactService = {
  submitContact: async (data: ContactPayload): Promise<ContactResponse> => {
    const response = await apiClient.post<ContactResponse>("/contact-us", data);
    return response.data;
  },
};

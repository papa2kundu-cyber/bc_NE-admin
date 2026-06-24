import { apiClient } from "@/lib/axios";

export interface FAQ {
  id: number;
  question: string;
  answer: string;
}

export interface CreateFAQPayload {
  // id:number;
  question: string;
  answer: string;
}

export const faqService = {
  createFaq: async (data: CreateFAQPayload): Promise<FAQ> => {
    const response = await apiClient.post<FAQ>("/create-faq", data);
    return response.data;
  },

  getAllFaqs: async (): Promise<FAQ[]> => {
    const response: any = await apiClient.get<FAQ[]>("/get-all-faq");
    return response.data.data;
  },

  updateFaq:async (id: number | string, data: Partial<CreateFAQPayload>): Promise<FAQ> => {
    const response = await apiClient.put<FAQ>(`/edit-faq/${id}`, data);
    return response.data;
  },
  deleteFaq: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/delete-faq/${id}`);
  },
};

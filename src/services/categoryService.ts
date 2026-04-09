import { apiClient } from "@/lib/axios";

export interface Category {
  id: number;
  name: string;
}

export interface AddCategoryPayload {
  name: string;
}

export const categoryService = {
  addCategory: async (data: AddCategoryPayload): Promise<Category> => {
    const response = await apiClient.post<Category>("/add-category", data);
    return response.data;
  },

  getAllCategories: async (): Promise<Category[]> => {
    const response: any = await apiClient.get<Category[]>("/get-all-category");
    return response.data.data;
  },
};

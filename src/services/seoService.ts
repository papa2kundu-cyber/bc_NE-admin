import { apiClient } from "@/lib/axios";

export interface PageSeo {
  id: number;
  name: string;
  meta_title: string;
  meta_description: string;
  canonical_url: string;
  keyword: string;
  robots_directive: string;
  og_title: string;
  og_description: string;
  feature_image: string;
  og_image: string;
}

export interface UpdatePageSeoPayload {
  name: string;
  meta_title: string;
  meta_description: string;
  canonical_url?: string;
  keyword?: string;
  robots_directive?: string;
  og_title?: string;
  og_description?: string;
  feature_image?: File | string | null;
  og_image?: File | string | null;
}

export const seoService = {
  getPages: async (): Promise<PageSeo[]> => {
    const response = await apiClient.get<PageSeo[]>("/pages");
    return response.data;
  },

  getPageById: async (id: number | string): Promise<PageSeo> => {
    const response = await apiClient.get<PageSeo>(`/page/${id}`);
    return response.data;
  },

  updatePageSeo: async (id: number | string, data: UpdatePageSeoPayload): Promise<PageSeo> => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("meta_title", data.meta_title);
    formData.append("meta_description", data.meta_description);
    if (data.canonical_url) formData.append("canonical_url", data.canonical_url);
    if (data.keyword) formData.append("keyword", data.keyword);
    if (data.robots_directive) formData.append("robots_directive", data.robots_directive);
    if (data.og_title) formData.append("og_title", data.og_title);
    if (data.og_description) formData.append("og_description", data.og_description);
    
    if (data.feature_image instanceof File) {
      formData.append("feature_image", data.feature_image);
    }
    if (data.og_image instanceof File) {
      formData.append("og_image", data.og_image);
    }

    // According to des.json it's a POST request to /page-update/{id}
    const response = await apiClient.post<PageSeo>(`/page-update/${id}`, formData);
    return response.data;
  },
};

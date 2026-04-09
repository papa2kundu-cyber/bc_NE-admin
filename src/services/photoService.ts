import { apiClient } from "@/lib/axios";

export interface Photo {
  id: number;
  category_id: number;
  title: string;
  description: string;
  images: string[];
}

export interface AddPhotoPayload {
  category_id: number | string;
  title: string;
  description: string;
  images: File[];
}

export interface UpdatePhotoPayload {
  category_id?: number | string;
  title?: string;
  description?: string;
  images?: File[];
}

export const photoService = {
  addPhoto: async (data: AddPhotoPayload): Promise<Photo> => {
    const formData = new FormData();
    formData.append("category_id", String(data.category_id));
    formData.append("title", data.title);
    formData.append("description", data.description);
    data.images.forEach((file) => {
      formData.append("images[]", file);
    });
    const response = await apiClient.post<Photo>("/add-photo", formData);
    return response.data;
  },

  getAllPhotos: async (): Promise<Photo[]> => {
    const response: any = await apiClient.get<Photo[]>("/get-all-photo");
    return response.data.data;
  },

  getPhotoById: async (id: number | string): Promise<Photo> => {
    const response: any = await apiClient.get<Photo>(`/get-photo/${id}`);
    return response.data.data;
  },

  updatePhoto: async (id: number | string, data: UpdatePhotoPayload): Promise<Photo> => {
    const formData = new FormData();
    if (data.category_id !== undefined) formData.append("category_id", String(data.category_id));
    if (data.title !== undefined) formData.append("title", data.title);
    if (data.description !== undefined) formData.append("description", data.description);
    if (data.images) {
      data.images.forEach((file) => {
        formData.append("images[]", file);
      });
    }
    // Laravel requires _method override for multipart PUT
    formData.append("_method", "PUT");
    const response = await apiClient.post<Photo>(`/edit-photo/${id}`, formData);
    return response.data;
  },

  deletePhoto: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/delete-photo/${id}`);
  },
};

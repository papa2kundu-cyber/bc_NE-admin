import { apiClient } from "@/lib/axios";

export interface Blog {
  id: number;
  category_id: number;
  title: string;
  description: string;
  username: string;
  publish_date: string;
  image: string;
}

export interface AddBlogPayload {
  category_id: number | string;
  title: string;
  description: string;
  username: string;
  publish_date: string;
  image?: File;
}

export interface UpdateBlogPayload {
  category_id?: number | string;
  title?: string;
  description?: string;
  username?: string;
  publish_date?: string;
  image?: File;
}

export const blogService = {
  addBlog: async (data: AddBlogPayload): Promise<Blog> => {
    const formData = new FormData();
    formData.append("category_id", String(data.category_id));
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("username", data.username);
    formData.append("publish_date", data.publish_date);
    if (data.image) formData.append("image", data.image);
    const response = await apiClient.post<Blog>("/add-blog", formData);
    return response.data;
  },

  getAllBlogs: async (): Promise<Blog[]> => {
    const response: any = await apiClient.get<Blog[]>("/get-all-blog");
    return response.data.data;
  },

  getBlogById: async (id: number | string): Promise<Blog> => {
    const response: any = await apiClient.get<Blog>(`/get-blog/${id}`);
    return response.data.data;
  },

  editBlog: async (id: number | string, data: UpdateBlogPayload): Promise<Blog> => {
    const formData = new FormData();
    if (data.category_id !== undefined) formData.append("category_id", String(data.category_id));
    if (data.title !== undefined) formData.append("title", data.title);
    if (data.description !== undefined) formData.append("description", data.description);
    if (data.username !== undefined) formData.append("username", data.username);
    if (data.publish_date !== undefined) formData.append("publish_date", data.publish_date);
    if (data.image) formData.append("image", data.image);
    // Laravel requires _method override for multipart PUT
    formData.append("_method", "PUT");
    const response = await apiClient.post<Blog>(`/edit-blog/${id}`, formData);
    return response.data;
  },

  deleteBlog: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/delete-blog/${id}`);
  },
};

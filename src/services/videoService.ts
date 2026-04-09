import { apiClient } from "@/lib/axios";

export interface Video {
  id: number;
  title: string;
  description: string;
  video_url: string;
}

export interface AddVideoPayload {
  title: string;
  description: string;
  video_url: string;
}

export interface UpdateVideoPayload {
  title?: string;
  description?: string;
  video_url?: string;
}

export const videoService = {
  addVideo: async (data: AddVideoPayload): Promise<Video> => {
    const response = await apiClient.post<Video>("/add-video", data);
    return response.data;
  },

  getAllVideos: async (): Promise<Video[]> => {
    const response: any = await apiClient.get<Video[]>("/get-all-video");
    return response.data.data;
  },

  editVideo: async (id: number | string, data: UpdateVideoPayload): Promise<Video> => {
    const response = await apiClient.put<Video>(`/edit-video/${id}`, data);
    return response.data;
  },

  deleteVideo: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/delete-video/${id}`);
  },
};

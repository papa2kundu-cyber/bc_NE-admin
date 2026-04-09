import { apiClient } from "@/lib/axios";

export interface Rating {
  id: number;
  name: string;
  email: string;
  rating?: number;
  description?: string;
  allowed?: boolean;
}

export interface RatingRequestPayload {
  name: string;
  email: string;
}

export const ratingService = {
  submitRatingRequest: async (data: RatingRequestPayload): Promise<Rating> => {
    const response = await apiClient.post<Rating>("/rating-request", data);
    return response.data;
  },

  getAllApprovedRatings: async (): Promise<Rating[]> => {
    const response: any = await apiClient.get<Rating[]>("/get-all-approved");
    return response.data.data;
  },

  getAllRatings: async (): Promise<Rating[]> => {
    const response: any = await apiClient.get<Rating[]>("/get-all-rating");
    return response.data.data;
  },

  deleteRating: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/delete-rating/${id}`);
  },
};

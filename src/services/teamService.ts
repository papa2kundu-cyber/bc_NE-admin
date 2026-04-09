import { apiClient } from "@/lib/axios";

export interface TeamMember {
  id: number;
  name: string;
  designation: string;
  description: string;
  image: string;
}

export interface CreateTeamPayload {
  name: string;
  designation: string;
  description: string;
  image?: File;
}

export interface UpdateTeamPayload {
  name?: string;
  designation?: string;
  description?: string;
  image?: File;
}

export const teamService = {
  createTeam: async (data: CreateTeamPayload): Promise<TeamMember> => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("designation", data.designation);
    formData.append("description", data.description);
    if (data.image) formData.append("image", data.image);
    const response = await apiClient.post<TeamMember>("/create-team", formData);
    return response.data;
  },

  getAllTeams: async (): Promise<TeamMember[]> => {
    const response: any = await apiClient.get<TeamMember[]>("/get-all-teams");
    return response.data.data;
  },

  getTeamById: async (id: number | string): Promise<TeamMember> => {
    const response: any = await apiClient.get<TeamMember>(`/get-teams/${id}`);
    return response.data.data;
  },

  editTeam: async (id: number | string, data: UpdateTeamPayload): Promise<TeamMember> => {
    const formData = new FormData();
    if (data.name !== undefined) formData.append("name", data.name);
    if (data.designation !== undefined) formData.append("designation", data.designation);
    if (data.description !== undefined) formData.append("description", data.description);
    if (data.image) formData.append("image", data.image);
    // Laravel requires _method override for multipart PUT
    formData.append("_method", "PUT");
    const response = await apiClient.post<TeamMember>(`/edit-teams/${id}`, formData);
    return response.data;
  },

  deleteTeam: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/delete-teams/${id}`);
  },
};

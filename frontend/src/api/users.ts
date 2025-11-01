// src/api/users.ts
import { axiosClient } from "@/utils/axiosClient";

export type Role = "ADMIN" | "ALUNO" | "PROFESSOR" | "COORDENADOR" | string; // ajuste se necessário
export type Turno = "MANHA" | "TARDE" | "NOITE" | string;

export interface UserProfile {
  userId: string;
  username: string;
  email: string;
  role: Role;
  turnoEnum: Turno | null;
}

/** Estrutura de Page do Spring Data */
export interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // página atual (0-based)
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  // pageable?: any; sort?: any; // se precisar
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  turnoEnum?: Turno | string;
}

export interface ListUsersParams {
  page?: number;
  size?: number;
  role?: Role; // ex.: 'ALUNO'
}

export const usersApi = {
  /** GET /api/user/{id} */
  getUser: async (userId: string) => {
    const { data } = await axiosClient.get<UserProfile>(`/api/user/${userId}`);
    return data;
  },

  /** PUT /api/user/{id} */
  updateUser: async (userId: string, payload: UpdateUserRequest) => {
    const { data } = await axiosClient.put<UserProfile>(
      `/api/user/${userId}`,
      payload,
    );
    return data;
  },

  /** DELETE /api/user/{id} */
  deleteUser: async (userId: string) => {
    await axiosClient.delete(`/api/user/${userId}`);
  },

  /** GET /api/user?page=&size=&role= */
  list: async (params: ListUsersParams = {}) => {
    const { page = 0, size = 10, role } = params;
    const query: Record<string, any> = { page, size };
    if (role) query.role = role;

    const { data } = await axiosClient.get<PageResult<UserProfile>>(
      "/api/user",
      { params: query },
    );
    return data;
  },
};

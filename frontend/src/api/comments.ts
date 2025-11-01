import { axiosClient } from "@/utils/axiosClient";

export interface Comment {
  commentId: string;
  postId: string;
  authorId: string;
  authorUsername: string;
  comment: string;
  // deixe como string | null se seu backend ainda puder retornar nulo
  commentTime: string | null;
  // (opcional) se você usa no front:
  rolePostEnum?: "ALUNO" | "PROFESSOR" | "COORDENACAO" | "ADMIN" | string;
  turnoEnum?: "MANHA" | "TARDE" | "NOITE" | string;
}

export interface CommentsResponse {
  items: Comment[];
  page: number; // 0-based
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface CreateCommentRequest {
  comment: string;
}

// >>> Novo: params opcionais para paginação
export interface GetCommentsParams {
  page?: number; // default 0
  size?: number; // default 10
}

export const commentsApi = {
  // Agora aceita params opcionais e envia como query string (?page=&size=)
  getComments: async (postId: string, params: GetCommentsParams = {}) => {
    const { page = 0, size = 10 } = params;

    const response = await axiosClient.get<CommentsResponse>(
      `/api/comments/${encodeURIComponent(postId)}`,
      {
        params: { page, size },
      },
    );
    return response.data;
  },

  createComment: async (postId: string, data: CreateCommentRequest) => {
    const response = await axiosClient.post<Comment>(
      `/api/comments/create/${encodeURIComponent(postId)}`,
      data,
    );
    return response.data;
  },

  deleteComment: async (commentId: string) => {
    await axiosClient.delete(`/api/comments/${encodeURIComponent(commentId)}`);
  },
};

// src/api/posts.ts
import { axiosClient } from "@/utils/axiosClient";

export interface Post {
  postId: string;
  authorId: string;
  authorUsername: string;
  content: string;
  rolePostEnum: string;
  createdAt: string;
  commentsCount: number;
  likeCount: number;
  likedByMe: boolean;

  // ✅ Novos campos vindos do backend
  authorRole?: string | null;
  authorTurnoEnum?: string | null;
}

export interface PostsResponse {
  items: Post[];
  nextCursor: string | null;
}

export interface CreatePostRequest {
  content: string;
  rolePostEnum: string;
}

export interface LikeResponse {
  postId: string;
  likeCount: number;
  likedByMe: boolean;
}

export const postsApi = {
  /**
   * Feed geral (sem filtro de autor)
   * GET /api/posts?limit=&cursor=
   */
  getPosts: async (limit = 10, cursor?: string) => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append("cursor", cursor);

    const response = await axiosClient.get<PostsResponse>(
      `/api/posts?${params.toString()}`,
    );
    return response.data;
  },

  /**
   * ✅ Posts de um autor específico (para a página de perfil)
   * GET /api/posts?authorId=&limit=&cursor=
   */
  getPostsByAuthor: async (authorId: string, limit = 10, cursor?: string) => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      authorId,
    });
    if (cursor) params.append("cursor", cursor);

    const response = await axiosClient.get<PostsResponse>(
      `/api/posts?${params.toString()}`,
    );
    return response.data;
  },

  /**
   * Criar post
   * POST /api/posts/create
   */
  createPost: async (data: CreatePostRequest) => {
    const response = await axiosClient.post<Post>("/api/posts/create", data);
    return response.data;
  },

  /**
   * Like
   * POST /api/posts/{postId}/likes
   */
  likePost: async (postId: string) => {
    const response = await axiosClient.post<LikeResponse>(
      `/api/posts/${postId}/likes`,
    );
    return response.data;
  },

  /**
   * Unlike
   * DELETE /api/posts/{postId}/likes
   */
  unlikePost: async (postId: string) => {
    const response = await axiosClient.delete<LikeResponse>(
      `/api/posts/${postId}/likes`,
    );
    return response.data;
  },

  /**
   * Excluir post
   * DELETE /api/posts/delete/{postId}
   */
  deletePost: async (postId: string) => {
    await axiosClient.delete(`/api/posts/delete/${postId}`);
  },
};

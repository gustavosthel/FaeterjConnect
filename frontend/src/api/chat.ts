import { axiosClient } from "@/utils/axiosClient";

export interface Participant {
  userId: string;
  username: string;
  email: string;
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  title: string | null;
  participants: Participant[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  content: string;
  timestamp: string;
  type?: string;
}

export interface MessagesResponse {
  content: Message[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  empty: boolean;
}

export const chatApi = {
  getConversations: async () => {
    const response = await axiosClient.get<Conversation[]>(
      "/api/chat/conversations",
    );
    return response.data;
  },

  createConversation: async (otherUserId: string) => {
    const response = await axiosClient.post<Conversation>(
      `/api/chat/conversations/${otherUserId}`,
    );
    return response.data;
  },

  getMessages: async (conversationId: string, page = 0, size = 20) => {
    const response = await axiosClient.get<MessagesResponse>(
      `/api/chat/conversations/${conversationId}/messages?page=${page}&size=${size}`,
    );
    return response.data;
  },
};

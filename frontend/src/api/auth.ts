// src/api/auth.ts
import { axiosClient } from "@/utils/axiosClient";

/** Requisições */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  roleEnum: string;
  turnoEnum: string;
}

/** Respostas do backend */
export interface AuthResponse {
  /** ✅ UUID do usuário (vem do TokenResponse do backend) */
  userId: string;
  username: string;
  email: string;
  roleEnum: string;
  turnoEnum: string | null;
  /** ✅ JWT para ser usado no Authorization */
  token: string;
}

/** Resposta do /api/me (opcional, útil para reparar/validar o estado no front) */
export interface MeResponse {
  userId: string;
  username: string;
  email: string;
  roleEnum: string;
  turnoEnum: string | null;
}

/** Validador simples de UUID (v1–v5) */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertUuid(value: string, ctx: string): void {
  if (!value || !UUID_REGEX.test(value)) {
    // Lança erro cedo para evitar “userId = eyJ...” parar no store
    // e facilitar o diagnóstico (stack de onde chamou).
    throw new Error(
      `[authApi] ${ctx}: userId inválido (esperado UUID). Recebido: ${String(value)}`,
    );
  }
}

export const authApi = {
  /**
   * Login de usuário.
   * OBS: O backend deve responder com TokenResponse contendo `userId` (UUID) e `token` (JWT).
   * Ex.: POST http://localhost:8080/api/user/login
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await axiosClient.post<AuthResponse>(
      "/api/user/login",
      data,
    );
    const res = response.data;

    // Sane checks para evitar poluir o store com dados inválidos
    if (!res?.token) {
      throw new Error("[authApi.login] token ausente na resposta do backend");
    }
    assertUuid(res.userId, "login");

    return res;
  },

  /**
   * Registro de usuário.
   * Se seu backend retornar o mesmo TokenResponse após registrar (com userId + token),
   * mantemos o mesmo tipo de resposta para facilitar o fluxo.
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await axiosClient.post<AuthResponse>(
      "/api/user/register",
      data,
    );
    const res = response.data;

    if (!res?.token) {
      throw new Error(
        "[authApi.register] token ausente na resposta do backend",
      );
    }
    assertUuid(res.userId, "register");

    return res;
  },

  /**
   * Dados do usuário logado (via token) — útil para “reparar” o estado do front
   * e confirmar o UUID após refresh.
   */
  async me(): Promise<MeResponse> {
    const { data } = await axiosClient.get<MeResponse>("/api/me");
    assertUuid(data.userId, "me");
    return data;
  },
};

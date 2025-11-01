// src/store/useAuthStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { axiosClient } from "@/utils/axiosClient";
import { authApi } from "@/api/auth";

export interface User {
  userId: string; // ✅ precisa ser UUID
  username: string;
  email: string;
  roleEnum: string;
  turnoEnum: string | null;
  profileImageUrl: string | null;
}

function isUuid(v: unknown): v is string {
  if (typeof v !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setProfileImageUrl: (url: string | null) => void;
  updateUser: (patch: Partial<User>) => void;
  getUserSeed: () => string;

  /** Opcional: tenta reparar o userId chamando /api/me */
  repairFromMe: () => Promise<void>;
}

export const useAuthStore = create(
  persist<AuthState>(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        // ✅ Blindagem: NUNCA aceite payload do JWT como userId
        if (!isUuid(user.userId)) {
          console.error(
            "[useAuthStore.setAuth] userId inválido (esperado UUID). Recebido:",
            user.userId,
          );
          // Não grava estado inválido — força correção no chamador
          set({ user: null, token: null, isAuthenticated: false });
          return;
        }
        const normalized: User = {
          userId: user.userId,
          username: user.username,
          email: user.email,
          roleEnum: user.roleEnum,
          turnoEnum: user.turnoEnum ?? null,
          profileImageUrl: user.profileImageUrl ?? null,
        };
        set({ user: normalized, token, isAuthenticated: true });
      },

      logout: () => set({ user: null, token: null, isAuthenticated: false }),

      setProfileImageUrl: (url) => {
        const prev = get().user;
        if (!prev) return;
        set({ user: { ...prev, profileImageUrl: url } });
      },

      updateUser: (patch) => {
        const prev = get().user;
        if (!prev) return;
        // Se vier userId no patch, valide também
        if (patch.userId && !isUuid(patch.userId)) {
          console.error(
            "[useAuthStore.updateUser] userId inválido no patch:",
            patch.userId,
          );
          return;
        }
        set({ user: { ...prev, ...patch } as User });
      },

      getUserSeed: () => get().user?.userId?.trim().toLowerCase() || "seed",

      repairFromMe: async () => {
        try {
          const token = get().token;
          if (!token) return;
          const { data } = await axiosClient.get("/api/me");
          if (data?.userId && isUuid(String(data.userId))) {
            const prev = get().user;
            const repaired: User = {
              userId: String(data.userId),
              username: data.username ?? prev?.username ?? "",
              email: data.email ?? prev?.email ?? "",
              roleEnum: data.roleEnum ?? prev?.roleEnum ?? "",
              turnoEnum: data.turnoEnum ?? prev?.turnoEnum ?? null,
              profileImageUrl: prev?.profileImageUrl ?? null,
            };
            set({ user: repaired, isAuthenticated: true });
          }
        } catch (e) {
          console.warn("[useAuthStore.repairFromMe] falhou:", e);
        }
      },
    }),
    {
      name: "auth",
      storage: createJSONStorage(() => localStorage),
      version: 4, // ⬅️ bump: limpa estados antigos com userId inválido

      migrate: (persisted, version) => {
        if (!persisted || typeof persisted !== "object")
          return persisted as any;

        // v3 -> v4: se userId não for UUID, limpa totalmente
        if (version < 4) {
          const state = persisted as any;
          const uid = state?.user?.userId;
          if (!uid || !isUuid(uid)) {
            console.warn(
              "[useAuthStore.migrate] Limpando auth persistido inválido (userId não-UUID):",
              uid,
            );
            return { user: null, token: null, isAuthenticated: false };
          }
          if (state.user.profileImageUrl === undefined) {
            state.user.profileImageUrl = null;
          }
          return state;
        }
        return persisted as any;
      },
    },
  ),
);

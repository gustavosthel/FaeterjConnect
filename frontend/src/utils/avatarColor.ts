// src/utils/avatarColor.ts
export function normalizeSeed(seed?: string) {
  return (seed ?? "seed").toString().trim().toLowerCase();
}

export function stableHash(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // força 32-bit
  }
  return Math.abs(hash);
}

// --- NOVO: cacheia o HUE por seed no localStorage, para ser estável "para sempre"
const PALETTE_KEY = "avatar_palette_v1";

function loadPalette(): Record<string, number> {
  try {
    const raw = localStorage.getItem(PALETTE_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return typeof obj === "object" && obj ? obj : {};
  } catch {
    return {};
  }
}

function savePalette(map: Record<string, number>) {
  try {
    localStorage.setItem(PALETTE_KEY, JSON.stringify(map));
  } catch {
    // storage pode falhar em modo privado; silencie
  }
}

/** Retorna um HUE fixo para o seed. Se ainda não existir, calcula uma vez e guarda. */
export function hueFromSeed(seed?: string) {
  const s = normalizeSeed(seed);
  const map = loadPalette();
  if (map[s] !== undefined) return map[s];
  const hue = stableHash(s) % 360;
  map[s] = hue;
  savePalette(map);
  return hue;
}

/** Gradiente pastel determinístico e persistente por seed. */
export function pastelGradientFromString(seed?: string) {
  const hue = hueFromSeed(seed);
  const hue2 = (hue + 35) % 360;

  const c1 = `hsl(${hue}, 55%, 82%)`;
  const c2 = `hsl(${hue2}, 60%, 72%)`;

  return {
    backgroundImage: `linear-gradient(135deg, ${c1}, ${c2})`,
    backgroundColor: c1,
  } as React.CSSProperties;
}

export function initialsFromName(name?: string) {
  if (!name?.trim()) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("");
  return initials.toUpperCase();
}

/** Preferir SEMPRE userId; fallback só se não houver mesmo. */
export function resolveUserSeed(params: {
  userId?: string;
  email?: string;
  username?: string;
}) {
  if (params.userId && params.userId.trim())
    return normalizeSeed(params.userId);
  if (params.email && params.email.trim()) return normalizeSeed(params.email);
  if (params.username && params.username.trim())
    return normalizeSeed(params.username);
  return "seed";
}

// --- Helpers p/ perfis
export type UserProfileLike = {
  userId?: string | null;
  username?: string | null;
  email?: string | null;
};

export function getUserSeedFromProfile(user?: UserProfileLike | null) {
  return resolveUserSeed({
    userId: user?.userId ?? undefined,
    email: user?.email ?? undefined,
    username: user?.username ?? undefined,
  });
}

// (Opcional) atalho quando só tem o id:
export function seedFromId(id?: string | null) {
  return id && id.trim() ? normalizeSeed(id) : "seed";
}

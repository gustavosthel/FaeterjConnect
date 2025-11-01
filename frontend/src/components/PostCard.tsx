import { useEffect, useMemo, useRef, useState } from "react";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  GraduationCap,
  Trash2,
  UserRound,
  Shield,
  Sunset,
  Building2,
  Sun,
  Moon,
  Clock,
  Link as LinkIcon,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  animate,
  type Variants,
} from "framer-motion";
import { Post } from "@/api/posts";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CommentList } from "./CommentList";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { resolveUserSeed } from "@/utils/avatarColor";
import { UserAvatar } from "@/components/UserAvatar";
import { format } from "date-fns";
import {
  differenceInHours,
  differenceInMinutes,
  differenceInDays,
} from "date-fns";
import { getUserSeedFromProfile } from "@/utils/avatarColor";
import { Card } from "./ui/card";

/* ========================= UI helpers ========================= */


// 🔑 Chaves possíveis (ajuste se tiver mais)
export type CategoryKey = "TODOS" | "LOCALIDADE" | "FACULDADE" | "GERAIS";

// 🎯 Estrutura de metadados para o chip
export type CategoryMeta = {
  label: string;
  cls: string;    // somente as classes de cor (bg/text/border + dark:)
  dotCls: string; // somente as classes de cor do pontinho (+ dark:)
  hoverCls?: string; // (opcional) cores no hover para itens que usam .group
  chipBg?: string;   // (opcional) overlay/marker p/ estado “ativo”
};

// 🗺️ Mapa completo — mantém o visual do claro e adiciona dark
export const CATEGORY_MAP: Record<CategoryKey, CategoryMeta> = {
  TODOS: {
    label: "Todos",
    cls: [
      "bg-indigo-50 text-indigo-700 border-indigo-200",
      "dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800",
    ].join(" "),
    dotCls: "bg-indigo-600 dark:bg-indigo-400",
    hoverCls:
      "group-hover:text-indigo-700 group-hover:border-indigo-600 dark:group-hover:text-indigo-300 dark:group-hover:border-indigo-400",
    chipBg: "bg-indigo-600/90",
  },
  LOCALIDADE: {
    label: "Localidade",
    cls: [
      "bg-rose-50 text-rose-700 border-rose-200",
      "dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800",
    ].join(" "),
    dotCls: "bg-rose-600 dark:bg-rose-400",
    hoverCls:
      "group-hover:text-rose-700 group-hover:border-rose-600 dark:group-hover:text-rose-300 dark:group-hover:border-rose-400",
    chipBg: "bg-rose-600/90",
  },
  FACULDADE: {
    label: "Faculdade",
    cls: [
      "bg-sky-50 text-sky-700 border-sky-200",
      "dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800",
    ].join(" "),
    dotCls: "bg-sky-600 dark:bg-sky-400",
    hoverCls:
      "group-hover:text-sky-700 group-hover:border-sky-600 dark:group-hover:text-sky-300 dark:group-hover:border-sky-400",
    chipBg: "bg-sky-600/90",
  },
  GERAIS: {
    label: "Gerais",
    cls: [
      "bg-emerald-50 text-emerald-700 border-emerald-200",
      "dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800",
    ].join(" "),
    dotCls: "bg-emerald-600 dark:bg-emerald-400",
    hoverCls:
      "group-hover:text-emerald-700 group-hover:border-emerald-600 dark:group-hover:text-emerald-300 dark:group-hover:border-emerald-400",
    chipBg: "bg-emerald-600/90",
  },
};

// 🔎 Helper seguro para buscar meta por string “qualquer”
export function getCategoryMeta(input?: string): CategoryMeta {
  const key = (input ?? "").toUpperCase() as CategoryKey;
  return CATEGORY_MAP[key] ?? CATEGORY_MAP.GERAIS;
}

function stripTrailingPunct(token: string) {
  const m = token.match(/([).,!?;:]+)$/);
  if (!m) return { core: token, trailing: "" };
  return { core: token.slice(0, -m[1].length), trailing: m[1] };
}
function toTelHref(raw: string) {
  const leadPlus = raw.trim().startsWith("+");
  const digits = raw.replace(/[^\d]/g, "");
  const final = leadPlus ? `+${digits}` : digits;
  return `tel:${final}`;
}
function parseContent(text: string): JSX.Element[] {
  const tokenRe =
    /(\r?\n)|((?:https?:\/\/|www\.)[^\s]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?)|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,})|(\+?\d[\d\s().-]{7,}\d)/gi;

  const nodes: JSX.Element[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const pushText = (txt: string, key: string) => {
    if (!txt) return;
    nodes.push(<span key={key}>{txt}</span>);
  };

  while ((match = tokenRe.exec(text)) !== null) {
    const [raw] = match;
    const start = match.index;
    if (start > lastIndex)
      pushText(text.slice(lastIndex, start), `t-${lastIndex}`);

    if (match[1]) {
      nodes.push(<br key={`br-${start}`} />);
      lastIndex = start + raw.length;
      continue;
    }

    const { core, trailing } = stripTrailingPunct(raw);

    if (match[2]) {
      const href = /^https?:\/\//i.test(core) ? core : `https://${core}`;
      nodes.push(
        <a
          key={`u-${start}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:underline break-words"
        >
          {core}
        </a>,
      );
      if (trailing) nodes.push(<span key={`ut-${start}`}>{trailing}</span>);
    } else if (match[3]) {
      const email = core;
      nodes.push(
        <a
          key={`e-${start}`}
          href={`mailto:${email}`}
          className="text-emerald-700 hover:underline break-words"
        >
          {email}
        </a>,
      );
      if (trailing) nodes.push(<span key={`et-${start}`}>{trailing}</span>);
    } else if (match[4]) {
      const phoneCore = core;
      nodes.push(
        <a
          key={`p-${start}`}
          href={toTelHref(phoneCore)}
          className="text-sky-700 hover:underline break-words"
        >
          {phoneCore}
        </a>,
      );
      if (trailing) nodes.push(<span key={`pt-${start}`}>{trailing}</span>);
    }

    lastIndex = start + raw.length;
  }
  if (lastIndex < text.length)
    pushText(text.slice(lastIndex), `t-${lastIndex}`);
  return nodes;
}

function humanizeEnum(s?: string | null) {
  if (!s) return null;
  return s
    .toString()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

type Meta = { label: string; cls: string; dotCls: string; icon: JSX.Element };

// Classe base para todos os badges (minimalista e consistente)
const BADGE_BASE =
  "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium border";

// Pontinho padrão (caso não mapeie)
const DOT_BASE = "inline-block h-2 w-2 rounded-full";

/** PAPÉIS (roles) */
export function getRoleMeta(role?: string): Meta | null {
  if (!role) return null;

  const map: Record<string, Meta> = {
    ALUNO: {
      label: "Aluno",
      cls: [
        BADGE_BASE,
        // 👇 Mesmas cores que você usava no claro
        "bg-emerald-50 text-emerald-700 border-emerald-200",
        // 👇 Equivalente no escuro
        "dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800",
      ].join(" "),
      dotCls: `${DOT_BASE} bg-emerald-600 dark:bg-emerald-400`,
      icon: <GraduationCap className="w-3.5 h-3.5" />,
    },

    PROFESSOR: {
      label: "Professor(a)",
      cls: [
        BADGE_BASE,
        "bg-indigo-50 text-indigo-700 border-indigo-200",
        "dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800",
      ].join(" "),
      dotCls: `${DOT_BASE} bg-indigo-600 dark:bg-indigo-400`,
      icon: <Shield className="w-3.5 h-3.5" />,
    },

    COORDENACAO: {
      label: "Coordenação",
      cls: [
        BADGE_BASE,
        "bg-amber-50 text-amber-700 border-amber-200",
        "dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800",
      ].join(" "),
      dotCls: `${DOT_BASE} bg-amber-600 dark:bg-amber-400`,
      icon: <Shield className="w-3.5 h-3.5" />,
    },

    ADMIN: {
      label: "Admin",
      cls: [
        BADGE_BASE,
        "bg-rose-50 text-rose-700 border-rose-200",
        "dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800",
      ].join(" "),
      dotCls: `${DOT_BASE} bg-rose-600 dark:bg-rose-400`,
      icon: <Shield className="w-3.5 h-3.5" />,
    },
  };

  return (
    map[role] ?? {
      label: role,
      // Fallback com tokens (fica elegante nos dois temas)
      cls: [
        BADGE_BASE,
        "bg-muted text-muted-foreground border-border",
        "dark:bg-muted dark:text-muted-foreground dark:border-border",
      ].join(" "),
      dotCls: `${DOT_BASE} bg-primary`,
      icon: <Shield className="w-3.5 h-3.5" />,
    }
  );
}

/** TURNOS */
export function getTurnoMeta(turno?: string): Meta | null {
  if (!turno) return null;

  const map: Record<string, Meta> = {
    MANHA: {
      label: "Manhã",
      cls: [
        BADGE_BASE,
        "bg-sky-50 text-sky-700 border-sky-200",
        "dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800",
      ].join(" "),
      dotCls: `${DOT_BASE} bg-sky-600 dark:bg-sky-400`,
      icon: <Sun className="w-3.5 h-3.5" />,
    },

    TARDE: {
      label: "Tarde",
      cls: [
        BADGE_BASE,
        "bg-orange-50 text-orange-700 border-orange-200",
        "dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800",
      ].join(" "),
      dotCls: `${DOT_BASE} bg-orange-600 dark:bg-orange-400`,
      icon: <Sunset className="w-3.5 h-3.5" />,
    },

    NOITE: {
      label: "Noite",
      cls: [
        BADGE_BASE,
        "bg-violet-50 text-violet-700 border-violet-200",
        "dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800",
      ].join(" "),
      dotCls: `${DOT_BASE} bg-violet-600 dark:bg-violet-400`,
      icon: <Moon className="w-3.5 h-3.5" />,
    },
  };

  return (
    map[turno] ?? {
      label: turno,
      cls: [
        BADGE_BASE,
        "bg-muted text-muted-foreground border-border",
        "dark:bg-muted dark:text-muted-foreground dark:border-border",
      ].join(" "),
      dotCls: `${DOT_BASE} bg-primary`,
      icon: <Sun className="w-3.5 h-3.5" />,
    }
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 0.28,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
  }, [value, mv]);
  return <span>{display}</span>;
}

/** 🎉 Confetti sutil para Like (sem forwardRef) */
function ConfettiBurst({ triggerKey }: { triggerKey: number }) {
  const particles = Array.from({ length: 8 }).map((_, i) => {
    const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.25;
    const dist = 22 + Math.random() * 14;
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;
    const size = 3 + Math.random() * 2;
    const rotate = (Math.random() * 100 - 50) | 0;
    const colors = [
      "#ef4444",
      "#f59e0b",
      "#10b981",
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
    ];
    const color = colors[i % colors.length];
    return { x, y, size, rotate, color, id: i };
  });

  return (
    <div className="pointer-events-none absolute inset-0">
      {particles.map((p) => (
        <motion.span
          key={`${triggerKey}-${p.id}`}
          initial={{ opacity: 0, scale: 0.6, x: 0, y: 0, rotate: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0.6, 1, 1, 0.9],
            x: p.x,
            y: p.y,
            rotate: p.rotate,
          }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}

/** 🌊 Ripple sutil — agora SEM capturar cliques e desmontando rápido */
function Ripple({
  triggerKey,
  color = "rgba(244,63,94,0.20)",
}: {
  triggerKey: number;
  color?: string;
}) {
  return (
    <motion.span
      key={`r-${triggerKey}`}
      initial={{ opacity: 0.3, scale: 0.2 }}
      animate={{ opacity: 0, scale: 1.4 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 999,
        boxShadow: `0 0 0 6px ${color} inset`,
        pointerEvents: "none", // 👈 não bloqueia o botão
      }}
    />
  );
}

/* ========================= Componente principal ========================= */

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => Promise<void> | void;
  onUnlike: (postId: string) => Promise<void> | void;
  onDelete?: (postId: string) => Promise<void> | void;
}

export const PostCard = ({
  post,
  onLike,
  onUnlike,
  onDelete,
}: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Permissão (usa username, pois o userId da store é JWT string)
  const { user } = useAuthStore();
  const isOwnPost =
    (user?.username ?? "").toLowerCase() ===
    (post.authorUsername ?? "").toLowerCase();
  const rawRole = (user as any)?.role ?? (user as any)?.roleEnum ?? null;
  const isAdmin =
    typeof rawRole === "string" &&
    ["ADMIN", "ADMINISTRADOR"].includes(rawRole.toUpperCase());
  const canDelete = isOwnPost || isAdmin;

  /* ========= Efeitos de like disparados SOMENTE quando props mudam p/ true ========= */

  const [likeBurstKey, setLikeBurstKey] = useState(0);
  const [showBurst, setShowBurst] = useState(false);
  const prevLikedRef = useRef(post.likedByMe);

  useEffect(() => {
    const prev = prevLikedRef.current;
    if (!prev && post.likedByMe) {
      setLikeBurstKey((k) => k + 1);
      setShowBurst(true);
      // desmonta os overlays após a animação (~500ms)
      const t = setTimeout(() => setShowBurst(false), 550);
      return () => clearTimeout(t);
    }
    prevLikedRef.current = post.likedByMe;
  }, [post.likedByMe, post.postId]);

  // Clique: só dispara callback do pai (API-driven)
  const handleLike = () => {
    if (post.likedByMe) onUnlike(post.postId);
    else onLike(post.postId);
  };

  const handleToggleComments = () => setShowComments((v) => !v);

  const cat = getCategoryMeta(post.rolePostEnum);

  const handleCopyLink = async () => {
    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "";
    const url = `${origin}/post/${post.postId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link do post copiado!");
    } catch {
      toast.error("Não foi possível copiar o link.");
    } finally {
      setMenuOpen(false);
    }
  };

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement)?.closest?.(`#menu-${post.postId}`)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [menuOpen, post.postId]);

  const commentsCount = post.commentsCount ?? 0;

  const heartVariants: Variants = {
    idle: { scale: 1, rotate: 0 },
    pop: {
      scale: [1, 1.18, 1],
      rotate: [0, -6, 0],
      transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const content: string = post.content ?? "";

  // Garante que createdAt não seja nulo/indefinido
  const date = post?.createdAt ? new Date(post.createdAt as any) : null;

  let timeText = date
    ? formatDistanceToNow(date, { addSuffix: true, locale: ptBR })
    : "agora";

  const exactTitle = date
    ? format(date, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })
    : "";

  if (date) {
    const now = new Date();
    const diffMinutes = differenceInMinutes(now, date);
    const diffHours = differenceInHours(now, date);
    const diffDays = differenceInDays(now, date);

    if (diffMinutes < 60) {
      timeText = `${diffMinutes}min`;
    } else if (diffHours < 24) {
      timeText = `${diffHours}h`;
    } else {
      timeText = `${diffDays}d`;
    }
  }

  // Badges (usando os mesmos helpers do comentário)
  const roleMeta = post?.authorRole ? getRoleMeta(post.authorRole) : null;
  const turnoMeta = post?.authorTurnoEnum
    ? getTurnoMeta(post.authorTurnoEnum)
    : null;
  const authorSeed = resolveUserSeed({ userId: post.authorId });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="group"
    >
      <Card className="relative overflow-hidden rounded-2xl border border-border p-5 shadow-sm transition-transform duration-200 group-hover:translate-y-[-1px] group-hover:shadow-md">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <UserAvatar
              name={post.authorUsername}
              seed={post.authorId} // ✅ SEMPRE o mesmo seed (userId)
              src={null} // quando tiver foto e presocar corrijir isso
              size={40}
              className="ring-1 ring-neutral-200"
            />

            {/* Coluna à direita do avatar */}
            <div className="flex-1 min-w-0 gap-2 flex flex-col">
              {/* Cabeçalho — igual ao comentário */}
              <div className="flex items-center gap-2">
                <h3 className="font-semibold leading-tight text-slate-900 dark:text-slate-100 text-sm truncate">
                  {post.authorUsername}
                </h3>
                <span className="text-muted-foreground">•</span>
                <time
                  className="text-xs text-muted-foreground dark:text-slate-400"
                  {...(date
                    ? { title: exactTitle, dateTime: date.toISOString() }
                    : {})}
                >
                  {timeText}
                </time>
              </div>

              <div className="col-start-2 mt-1.5 flex flex-wrap items-center gap-1.5">
                {roleMeta && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-full border leading-none ${roleMeta.cls}`}
                    title={`Papel: ${roleMeta.label}`}
                  >
                    {roleMeta.icon}
                    {roleMeta.label}
                  </span>
                )}
                {turnoMeta && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-full border leading-none ${turnoMeta.cls}`}
                    title={`Turno: ${turnoMeta.label}`}
                  >
                    {turnoMeta.icon}
                    {turnoMeta.label}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 👉 Badge de categoria + menu no topo direito */}
          <div className="flex items-center gap-2">
            <span
              className={`
                inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium border
                ${cat.cls}
              `}
            >
              <span className={`inline-block h-2 w-2 rounded-full ${cat.dotCls}`} />
              {cat.label}
            </span>

            <div className="relative" id={`menu-${post.postId}`}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex items-center justify-center h-8 w-8 rounded-full text-muted-foreground hover:text-foreground/80 hover:bg-muted transition-colors"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Mais opções"
                title="Mais opções"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-background shadow-lg z-20"
                  >
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground/80 hover:bg-muted"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Copiar link
                    </button>

                    {/* Excluir via menu (quando permitido) */}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          onDelete?.(post.postId);
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir post
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        {!!content && (
          <div className="prose prose-sm max-w-none text-foreground/90 whitespace-pre-wrap break-words">
            {parseContent(content)}
          </div>
        )}

        {/* Ações (like/comentários) */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Like */}
            <div className="relative">
              <motion.button
                type="button"
                aria-label={post.likedByMe ? "Remover like" : "Curtir"}
                aria-pressed={post.likedByMe}
                onClick={handleLike}
                variants={heartVariants}
                animate={post.likedByMe ? "pop" : "idle"}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm
                  transition-colors focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
                  ${
                    post.likedByMe
                      ? // ATIVO: rosa no claro e equivalente no escuro (sem borda)
                        "text-rose-600 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/30"
                      : // INATIVO: hover MINIMALISTA já NA COR FINAL (rosa), sem usar accent (roxo)
                        "text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-300 dark:hover:bg-rose-950/25"
                  }`}
              >
                <Heart
                  className={`w-5 h-5 transition-transform ${
                    post.likedByMe
                      ? "fill-rose-600 stroke-rose-600 dark:fill-rose-400 dark:stroke-rose-400"
                      : ""
                  }`}
                />
                <span className="tabular-nums">{post.likeCount ?? 0}</span>
              </motion.button>

              {/* Burst */}
              <AnimatePresence initial={false}>
                {showBurst && (
                  <>
                    <Ripple triggerKey={likeBurstKey} />
                    <motion.div
                      key={`confetti-${post.postId}-${likeBurstKey}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
                      aria-hidden
                    >
                      <ConfettiBurst triggerKey={likeBurstKey} />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Comentários */}
            <button
              type="button"
              onClick={handleToggleComments}
              className={`relative inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm
                transition-colors focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
                ${
                  showComments
                    ? // ATIVO: (mantive índigo no ativo como antes) — se quiser mudo p/ azul (sky)
                      "text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-950/30"
                    : // INATIVO: hover neutro (sem roxo), minimalista
                      "text-muted-foreground hover:text-foreground/80 hover:bg-muted"
                }`}
              aria-expanded={showComments}
              aria-controls={`comments-${post.postId}`}
              title="Ver comentários"
            >
              <motion.span
                animate={{ scale: showComments ? 1.06 : 1 }}
                transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex"
                aria-hidden
              >
                <MessageCircle className="w-5 h-5" />
              </motion.span>
              <span className="tabular-nums" title={`${commentsCount} comentários`}>
                <AnimatedNumber value={commentsCount} />
              </span>
            </button>
          </div>
        </div>

        {/* Comentários – slide + fade (altura) */}
        <AnimatePresence initial={false}>
          {showComments && (
            <motion.div
              key="comments"
              id={`comments-${post.postId}`}
              initial={{ height: 0, opacity: 0, y: -4 }}
              animate={{ height: "auto", opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 pt-4 border-t border-border"
              style={{
                overflow: "hidden",
                willChange: "height, opacity, transform",
              }}
            >
              <CommentList postId={post.postId} />
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

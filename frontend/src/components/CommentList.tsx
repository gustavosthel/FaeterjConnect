import { useEffect, useMemo, useRef, useState } from "react";
import {
  Send,
  Trash2,
  Loader2,
  Sun,
  Sunset,
  Moon,
  GraduationCap,
  Shield,
  MessageSquareText,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { commentsApi, Comment, CommentsResponse } from "@/api/comments";
import { Button } from "@/components/ui/button";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { UserAvatar } from "@/components/UserAvatar";
import { resolveUserSeed } from "@/utils/avatarColor";

/* =========================================
 * Tipos auxiliares (badges)
 * =======================================*/
type Role = "ALUNO" | "PROFESSOR" | "COORDENACAO" | "ADMIN" | string;
type Turno = "MANHA" | "TARDE" | "NOITE" | string;

function getRoleMeta(role?: Role) {
  if (!role) return null;
  const map: Record<string, { label: string; cls: string; icon: JSX.Element }> =
    {
      ALUNO: {
        label: "Aluno",
        cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800",
        icon: <GraduationCap className="w-3.5 h-3.5" />,
      },
      PROFESSOR: {
        label: "Professor(a)",
        cls: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800",
        icon: <Shield className="w-3.5 h-3.5" />,
      },
      COORDENACAO: {
        label: "Coordenação",
        cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800",
        icon: <Shield className="w-3.5 h-3.5" />,
      },
      ADMIN: {
        label: "Admin",
        cls: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800",
        icon: <Shield className="w-3.5 h-3.5" />,
      },
    };
  return (
    map[role] ?? {
      label: role,
      cls: "bg-muted text-foreground/80 border-border dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-700",
      icon: <Shield className="w-3.5 h-3.5" />,
    }
  );
}

function getTurnoMeta(turno?: Turno) {
  if (!turno) return null;
  const map: Record<string, { label: string; cls: string; icon: JSX.Element }> =
    {
      MANHA: {
        label: "Manhã",
        cls: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800",
        icon: <Sun className="w-3.5 h-3.5" />,
      },
      TARDE: {
        label: "Tarde",
        cls: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800",
        icon: <Sunset className="w-3.5 h-3.5" />,
      },
      NOITE: {
        label: "Noite",
        cls: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800",
        icon: <Moon className="w-3.5 h-3.5" />,
      },
    };
  return (
    map[turno] ?? {
      label: turno,
      cls: "bg-muted text-foreground/80 border-border dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-700",
      icon: <Sun className="w-3.5 h-3.5" />,
    }
  );
}

/* =========================================
 * Textarea auto-expansível (UI only)
 * =======================================*/
function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  disabled,
  maxLength,
  onSubmitShortcut,
  minHeight = 48,
  maxHeight = 220,
  charCount,
  limit,
  isOverLimit,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  onSubmitShortcut?: () => void;
  minHeight?: number;
  maxHeight?: number;
  charCount?: number;
  limit?: number;
  isOverLimit?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(maxHeight, Math.max(minHeight, el.scrollHeight));
    el.style.height = `${next}px`;
  }, [value, minHeight, maxHeight]);

  const pct =
    limit && typeof charCount === "number"
      ? Math.min(100, Math.round((charCount / limit) * 100))
      : 0;

  return (
    <div
      className={[
        "rounded-xl border bg-background/70 dark:bg-background/50 transition-all duration-200",
        focused
          ? "border-primary/40 ring-2 ring-primary/30 shadow-[0_6px_20px_-10px_rgba(0,0,0,0.35)]"
          : "border-muted ring-1 ring-transparent shadow-sm",
      ].join(" ")}
    >
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        rows={1}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          const isCmdEnter = (e.metaKey || e.ctrlKey) && e.key === "Enter";
          if (isCmdEnter && onSubmitShortcut) {
            e.preventDefault();
            onSubmitShortcut();
          }
        }}
        aria-invalid={!!isOverLimit}
        className={[
          "w-full resize-none bg-transparent outline-none",
          "text-sm md:text-[0.95rem] leading-6",
          "px-3.5 py-2.5 sm:px-4 sm:py-3",
          "placeholder:text-slate-400 dark:placeholder:text-muted-foreground",
          "selection:bg-primary/20 selection:text-foreground",
          "disabled:opacity-60 disabled:pointer-events-none",
        ].join(" ")}
      />
      {typeof limit === "number" && (
        <div className="px-3.5 sm:px-4 pb-2.5 sm:pb-3">
          <div className="h-1 rounded bg-muted/50 overflow-hidden">
            <div
              className={`h-1 rounded transition-all duration-200 ${
                isOverLimit ? "bg-destructive" : "bg-primary/70"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================
 * Skeleton (loading)
 * =======================================*/
function CommentSkeleton() {
  return (
    <div className="grid grid-cols-[auto,1fr] items-start gap-3 p-4 rounded-xl border bg-card/60 animate-pulse shadow-sm">
      <div className="w-10 h-10 rounded-full bg-muted" />
      <div className="space-y-2">
        <div className="h-3 w-40 bg-muted rounded" />
        <div className="h-3 w-24 bg-muted rounded" />
        <div className="mt-3 h-3 w-full bg-muted rounded" />
        <div className="h-3 w-3/5 bg-muted rounded" />
      </div>
    </div>
  );
}

/* =========================================
 * Animações Motion
 * =======================================*/
const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.18 } },
};

/* =========================================
 * Constantes / Props
 * =======================================*/
const PAGE_SIZE = 10;

interface CommentListProps {
  postId: string;
}

/* =========================================
 * Componente principal
 * =======================================*/
export const CommentList = ({ postId }: CommentListProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // paginação fornecida pelo backend
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [size, setSize] = useState<number>(PAGE_SIZE);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  // form
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // menu de exclusão (por comentário)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { user } = useAuthStore();
  const MAX_LEN = 250;
  const charCount = newComment.length;
  const isOverLimit = charCount > MAX_LEN;

  const currentUserSeed = useMemo(
    () => resolveUserSeed({ userId: user?.userId, username: user?.username }),
    [user?.userId, user?.username],
  );

  /* -------- API helpers -------- */
  const fetchPage = async (pageIndex: number): Promise<CommentsResponse> => {
    const data = await commentsApi.getComments(postId, {
      page: pageIndex,
      size: PAGE_SIZE,
    });
    return data;
  };

  /* -------- Load inicial: page 0 (mais recentes) -------- */
  const loadInitial = async () => {
    try {
      const data = await fetchPage(0);
      setComments(data.items ?? []);
      setCurrentPage(data.page ?? 0);
      setTotalPages(data.totalPages ?? 1);
      setTotalElements(data.totalElements ?? data.items?.length ?? 0);
      setSize(data.size ?? PAGE_SIZE);
      setHasMore(!!data.hasNext);
    } catch {
      toast.error("Erro ao carregar comentários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setComments([]);
    setCurrentPage(0);
    setTotalPages(0);
    setTotalElements(0);
    setHasMore(false);
    setOpenMenuId(null);
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  /* -------- Criar comentário (insere no topo) -------- */
  const handleSubmit = async () => {
    if (!newComment.trim() || submitting || isOverLimit) return;
    setSubmitting(true);
    try {
      const comment = await commentsApi.createComment(postId, {
        comment: newComment,
      });

      // Insere no topo (mantém coerente com ordenação desc do backend)
      setComments((prev) => {
        const map = new Map<string, Comment>();
        [comment, ...prev].forEach((c) => map.set(c.commentId, c));
        return Array.from(map.values());
      });

      setTotalElements((t) => t + 1);
      setNewComment("");
      toast.success("Comentário adicionado!");
    } catch {
      toast.error("Erro ao adicionar comentário");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  /* -------- Remover comentário -------- */
  const handleDelete = async (commentId: string) => {
    try {
      await commentsApi.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.commentId !== commentId));
      setTotalElements((t) => Math.max(0, t - 1));
      setOpenMenuId(null);
      toast.success("Comentário removido");
    } catch {
      toast.error("Erro ao remover comentário");
    }
  };

  /* -------- Ver mais (próxima página = mais antigos) -------- */
  const loadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextIndex = currentPage + 1; // próxima página
      const data = await fetchPage(nextIndex);

      setComments((prev) => {
        const merged = [...prev, ...(data.items ?? [])]; // anexa ao fim (mais antigos)
        const map = new Map<string, Comment>(); // de-dup por segurança
        merged.forEach((c) => map.set(c.commentId, c));
        return Array.from(map.values());
      });

      setCurrentPage(data.page ?? nextIndex);
      setTotalPages(data.totalPages ?? totalPages);
      setTotalElements(data.totalElements ?? totalElements);
      setSize(data.size ?? size);
      setHasMore(!!data.hasNext);
    } catch {
      toast.error("Erro ao carregar mais comentários");
    } finally {
      setLoadingMore(false);
    }
  };

  /* -------- Fechar menu ao clicar fora / ESC -------- */
  useEffect(() => {
    if (!openMenuId) return;

    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const withinMenu = target.closest(`[data-menu-for="${openMenuId}"]`);
      if (!withinMenu) setOpenMenuId(null);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenuId(null);
    };

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [openMenuId]);

  /* -------- Derivados -------- */
  const displayedCount = comments.length;
  const remaining = Math.max(0, totalElements - displayedCount);

  /* -------- UI: Loading inicial -------- */
  if (loading) {
    return (
      <div className="space-y-3">
        <CommentSkeleton />
        <CommentSkeleton />
      </div>
    );
  }

  /* -------- UI -------- */
  return (
    <MotionConfig transition={{ duration: 0.22, ease: "easeOut" }}>
      <div className="space-y-5">
        {/* Formulário de novo comentário */}
        <form
          onSubmit={handleFormSubmit}
          className="p-4 rounded-2xl border bg-card/60 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60"
        >
          <div className="flex items-start gap-3">
            <UserAvatar
              name={user?.username}
              seed={currentUserSeed}
              size={40}
            />

            <div className="flex-1 space-y-2">
              <AutoResizeTextarea
                value={newComment}
                onChange={setNewComment}
                placeholder="Escreva um comentário…"
                disabled={submitting}
                maxLength={MAX_LEN}
                onSubmitShortcut={handleSubmit} // Ctrl/Cmd + Enter
                minHeight={48}
                maxHeight={220}
                charCount={charCount}
                limit={MAX_LEN}
                isOverLimit={isOverLimit}
              />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-xs text-muted-foreground order-2 sm:order-1">
                  Dica: use{" "}
                  <kbd className="px-1 py-0.5 rounded bg-muted">Ctrl/Cmd</kbd> +{" "}
                  <kbd className="px-1 py-0.5 rounded bg-muted">Enter</kbd> para
                  enviar.
                </span>

                <div className="order-1 sm:order-2 flex items-center gap-2 self-end sm:self-auto">
                  <span
                    className={`text-xs ${
                      isOverLimit
                        ? "text-destructive font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {charCount}/{MAX_LEN}
                  </span>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={submitting || !newComment.trim() || isOverLimit}
                    className="h-8 px-3"
                  >
                    Comentar
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Lista de comentários */}
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          <AnimatePresence initial={false}>
            {comments.map((comment) => {
              const authorSeed = resolveUserSeed({
                userId: comment.authorId,
                username: comment.authorUsername,
              });

              // Tempo (seguro a nulo)
              const date = comment?.commentTime
                ? new Date(comment.commentTime as any)
                : null;
              const exactTitle = date
                ? format(date, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })
                : "";
              const timeText = date
                ? formatDistanceToNow(date, { addSuffix: true, locale: ptBR })
                : "agora";

              // Badges
              const roleMeta = getRoleMeta(
                (comment as any)?.rolePostEnum as Role | undefined,
              );
              const turnoMeta = getTurnoMeta(
                (comment as any)?.turnoEnum as Turno | undefined,
              );

              // Permissão para excluir (autor do comentário OU admin)
              const isOwnerById =
                user?.userId &&
                comment.authorId &&
                user.userId === comment.authorId;
              const isOwnerByName =
                (user?.username ?? "").toLowerCase() ===
                (comment.authorUsername ?? "").toLowerCase();
              const rawRole =
                (user as any)?.role ?? (user as any)?.roleEnum ?? null;
              const isAdmin =
                typeof rawRole === "string" &&
                ["ADMIN", "ADMINISTRADOR"].includes(rawRole.toUpperCase());
              const canDelete = Boolean(
                isOwnerById || isOwnerByName || isAdmin,
              );

              const menuOpen = openMenuId === comment.commentId;

              return (
                <motion.div
                  key={comment.commentId}
                  variants={itemVariants}
                  exit="exit"
                  whileHover={{ y: -1 }}
                  className="group relative grid grid-cols-[auto,1fr] items-start gap-3 p-4 rounded-xl border bg-card/60 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Avatar (coluna 1) */}
                  <div className="row-span-2">
                    <UserAvatar
                      name={comment.authorUsername}
                      seed={authorSeed}
                      size={40}
                    />
                  </div>

                  {/* Cabeçalho (linha 1, coluna 2) */}
                  <div className="col-start-2 flex items-center gap-2 relative">
                    <h3 className="font-semibold leading-tight text-slate-900 dark:text-slate-100 text-sm truncate">
                      {comment.authorUsername}
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

                    {/* Menu (Excluir) — canto superior direito do card */}
                    {canDelete && (
                      <div
                        className="absolute top-0 right-0"
                        data-menu-for={comment.commentId}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId((prev) =>
                              prev === comment.commentId
                                ? null
                                : comment.commentId,
                            )
                          }
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
                              transition={{
                                duration: 0.16,
                                ease: [0.16, 1, 0.3, 1],
                              }}
                              className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-background shadow-lg z-20"
                              role="menu"
                            >
                              <button
                                type="button"
                                onClick={() => handleDelete(comment.commentId)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                                role="menuitem"
                                title="Excluir comentário"
                              >
                                <Trash2 className="w-4 h-4" />
                                Excluir comentário
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  {/* Badges (linha 2, coluna 2) */}
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

                  {/* Texto do comentário: abaixo do avatar (span nas 2 colunas) */}
                  <p className="col-span-2 mt-3 text-[0.95rem] leading-relaxed whitespace-pre-wrap break-words">
                    {comment.comment}
                  </p>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {comments.length === 0 && (
            <div className="p-6 rounded-xl border bg-card/50 text-center">
              <div className="mx-auto mb-2 w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                <MessageSquareText className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Nenhum comentário ainda. Seja o primeiro!
              </p>
            </div>
          )}
        </motion.div>

        {/* Ver mais (traz mais antigos) */}
        {hasMore && (
          <div className="flex justify-center pt-1">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={loadingMore}
              className="gap-2"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando…
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Ver mais comentários
                  {remaining > 0 ? ` (${Math.min(remaining, size)})` : ""}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </MotionConfig>
  );
};

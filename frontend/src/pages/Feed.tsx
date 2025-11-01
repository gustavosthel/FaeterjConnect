import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Plus,
  Bell,
  Search,
  Sparkles,
  TrendingUp,
  Flame,
  GraduationCap,
} from "lucide-react";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { PostCard } from "@/components/PostCard";
import { CreatePostModal } from "@/components/CreatePostModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { postsApi, type Post } from "@/api/posts";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/useAuthStore";
import { MapPin } from "lucide-react";
import { AnimatePresence, Variants, Transition } from "framer-motion";
import { Menu } from "lucide-react";
// topo do arquivo
import LocalidadeMap from "@/components/LocalidadeMap";
import { UserAvatar } from "@/components/UserAvatar";
import { getUserSeedFromProfile } from "@/utils/avatarColor";

// Bolinha por categoria (timeline)
function getCategoryBorder(role?: string) {
  switch (role) {
    case "LOCALIDADE":
      return "border-sky-600";
    case "FACULDADE":
      return "border-emerald-600";
    case "GERAIS":
      return "border-indigo-600";
    default:
      return "border-indigo-600";
  }
}

const Feed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Header animado (auto-hide on scroll)
  const [showHeader, setShowHeader] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Dialog de confirmação de exclusão
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [postToDeleteId, setPostToDeleteId] = useState<string | null>(null);

  // Scroll até novo post
  const scrollToNewRef = useRef(false);

  const { user } = useAuthStore();

  // ⬇️ NEW: usa exatamente a mesma seed do PostCard
  const userSeed = useMemo(
    () =>
      ((user as any)?.userId || (user as any)?.username) as string | undefined,
    [user],
  );

  const loadPosts = useCallback(async (cursor?: string) => {
    try {
      if (cursor) setLoadingMore(true);
      else setLoading(true);

      const data = await postsApi.getPosts(10, cursor);

      if (cursor) {
        setPosts((prev) => [...prev, ...data.items]);
      } else {
        setPosts(data.items);
        // Scroll suave ao novo post após criar
        if (scrollToNewRef.current) {
          requestAnimationFrame(() => {
            const firstId = data.items?.[0]?.postId;
            const el = firstId
              ? document.getElementById(`post-${firstId}`)
              : null;
            if (el)
              el.scrollIntoView({
                behavior: "smooth",
                block: "start",
                inline: "nearest",
              });
            else window.scrollTo({ top: 0, behavior: "smooth" });
            scrollToNewRef.current = false;
          });
        }
      }

      setNextCursor(data.nextCursor);
    } catch {
      toast.error("Erro ao carregar posts");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Auto-hide header
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY || 0;
          setScrolled(currentY > 8);
          if (currentY > lastScrollY && currentY > 80) setShowHeader(false);
          else setShowHeader(true);
          setLastScrollY(currentY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastScrollY]);

  /* ===== Handlers de Like/Unlike (driven by API response) ===== */
  async function handleLike(postId: string) {
    try {
      const res = await postsApi.likePost(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.postId === res.postId
            ? { ...p, likedByMe: res.likedByMe, likeCount: res.likeCount }
            : p,
        ),
      );
    } catch (e) {
      toast.error("Erro ao curtir");
    }
  }

  async function handleUnlike(postId: string) {
    try {
      const res = await postsApi.unlikePost(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.postId === res.postId
            ? { ...p, likedByMe: res.likedByMe, likeCount: res.likeCount }
            : p,
        ),
      );
    } catch (e) {
      toast.error("Erro ao remover like");
    }
  }

  // Abrir diálogo de excluir (acionado pelo menu ⋯ do PostCard)
  const requestDelete = (postId: string) => {
    setPostToDeleteId(postId);
    setConfirmOpen(true);
  };

  // Confirmar exclusão — API inalterada
  const confirmDelete = async () => {
    if (!postToDeleteId) return;
    try {
      setDeleting(true);
      await postsApi.deletePost(postToDeleteId);
      setPosts((prev) => prev.filter((p) => p.postId !== postToDeleteId));
      setConfirmOpen(false);
      setPostToDeleteId(null);
      toast.success("Post excluído");
    } catch {
      toast.error("Erro ao excluir post");
    } finally {
      setDeleting(false);
    }
  };

  // Busca decorativa
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      toast.info(
        "Busca em breve ✨ (visual apenas, sem alterar a lógica do feed)",
      );
    }
  };

  // Animações
  const headerVariants: Variants = {
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
    },
    hidden: {
      y: -80,
      opacity: 0.98,
      transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
    },
  };
  const listVariants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12, scale: 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
    },
  };

  // ===== Filtro por categoria =====
  type CategoryFilter = "TODOS" | "LOCALIDADE" | "FACULDADE" | "GERAIS";

  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>("TODOS");

  // Contagem por categoria baseada nos posts já carregados
  const categoryCounts = useMemo(() => {
    return posts.reduce(
      (acc: Record<"LOCALIDADE" | "FACULDADE" | "GERAIS", number>, p: any) => {
        const r = p?.rolePostEnum as CategoryFilter | undefined;
        if (r === "LOCALIDADE" || r === "FACULDADE" || r === "GERAIS")
          acc[r] += 1;
        return acc;
      },
      { LOCALIDADE: 0, FACULDADE: 0, GERAIS: 0 },
    );
  }, [posts]);

  // Lista efetivamente exibida (filtrada)
  const filteredPosts = useMemo(() => {
    if (selectedCategory === "TODOS") return posts;
    return posts.filter((p: any) => p.rolePostEnum === selectedCategory);
  }, [posts, selectedCategory]);

  // ===== Animações (tipadas) =====
  const spring: Transition = {
    type: "spring",
    stiffness: 420,
    damping: 28,
    mass: 0.6,
  };

  const filterListVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.045,
        delayChildren: 0.04,
      },
    },
  };

  const filterItemVariants: Variants = {
    hidden: { opacity: 0, y: 12, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: spring },
    exit: {
      opacity: 0,
      y: -8,
      scale: 0.98,
      transition: { duration: 0.18, ease: [0.2, 0.7, 0.3, 1] },
    },
  };

  // cor do "pill" animado do chip ativo
  function activeChipBg(key: CategoryFilter): string {
    switch (key) {
      case "LOCALIDADE":
        return "bg-rose-600/90";
      case "FACULDADE":
        return "bg-sky-600/90";
      case "GERAIS":
        return "bg-emerald-600/90";
      default:
        return "bg-indigo-600/90"; // TODOS
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-slate-100 via-white to-indigo-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-slate-900 relative overflow-hidden">
      {/* BG shapes acadêmicos */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl" />
      </div>

      <Sidebar />

      <main className="flex-1 ml-0 md:ml-64 p-0 pt-[60px] sm:pt-[68px]">
        {/* HEADER FIXO com auto-hide */}
        <motion.header
          variants={headerVariants}
          animate={showHeader ? "visible" : "hidden"}
          className={`fixed top-0 left-0 md:left-64 right-0 z-40 border-b ${scrolled ? "bg-background/90 shadow-sm backdrop-blur" : "bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60"}`}
        >
          <div
            className={`mx-auto max-w-3xl px-4 sm:px-6 ${scrolled ? "py-2.5" : "py-3.5"} flex items-center gap-3 sm:gap-4 transition-[padding] duration-200`}
          >
            {/* Botão do menu (MOBILE) que abre a Sidebar via evento */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("sidebar:open"))}
              className="md:hidden ml-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-label="Abrir menu"
              title="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Busca */}
            <form
              onSubmit={(e) => e.preventDefault()}
              className="relative flex-1 max-w-xl"
              role="search"
              aria-label="Buscar no feed"
            >
              {/* Ícone */}
              <Search
                aria-hidden
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              />

              {/* Input */}
              <input
                type="search"
                aria-label="Buscar"
                placeholder="Buscar no campus, cursos ou geral..."
                onKeyDown={handleSearchKeyDown}
                className="
                  w-full rounded-full
                  border border-input
                  bg-background text-foreground
                  placeholder:text-muted-foreground
                  px-10 py-2.5 text-sm shadow-sm

                  focus-visible:outline-none
                  focus-visible:ring-2 focus-visible:ring-ring
                  focus-visible:ring-offset-2 focus-visible:ring-offset-background
                "
              />
            </form>

            {/* Notificações */}
            <Button
              variant="ghost"
              className="rounded-full"
              aria-label="Notificações"
              title="Notificações"
            >
              <Bell className="h-5 w-5" />
            </Button>

            <UserAvatar
              name={user.username}
              seed={user.userId} // ✅ SEMPRE o mesmo seed (userId)
              src={user.profileImageUrl ?? null} // quando tiver foto
              size={40}
              className="ring-1 ring-neutral-200"
            />

            {/* CTA (desktop/tablet) */}
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="hidden sm:inline-flex rounded-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo Post
            </Button>
          </div>
        </motion.header>

        {/* Spacer para o header fixo */}
        <div className="h-[60px] sm:h-[64px]" aria-hidden />

        {/* CONTEÚDO */}
        <div className="p-6 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl mx-auto"
          >
            {/* HERO (redesenhado, foco nos filtros + animação) */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600 p-[1px] shadow-md mb-6">
              <div className="rounded-2xl bg-background">
                <div className="px-6 sm:px-8 py-8">
                  {/* Cabeçalho */}
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center mb-6"
                  >
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-indigo-700">
                      Feed da Comunidade
                    </h1>
                    <p className="mt-2 text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
                      Explore novidades, compartilhe ideias e acompanhe o que
                      está acontecendo no campus.
                    </p>
                  </motion.div>

                  {/* Destaque visual */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="flex justify-center mb-6"
                  >
                    
                  <div
                    className="
                      inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium
                      bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50
                      text-indigo-700 shadow-sm ring-1 ring-inset ring-indigo-200/60

                      dark:from-indigo-950/30 dark:via-sky-950/30 dark:to-emerald-950/30
                      dark:text-indigo-300 dark:ring-indigo-800/40
                    "
                  >
                    <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden />
                    Conecte-se com sua comunidade acadêmica
                  </div>

                  </motion.div>

                  {/* ===== Filtro por categoria (chips com animação elaborada) ===== */}
                  <div className="flex flex-wrap justify-center gap-3">
                    {(
                      [
                        {
                          key: "TODOS" as CategoryFilter,
                          label: "Todos",
                          Icon: Sparkles,
                          count: posts.length,
                        },
                        {
                          key: "LOCALIDADE" as CategoryFilter,
                          label: "Localidade",
                          Icon: MapPin,
                          count: categoryCounts.LOCALIDADE,
                        },
                        {
                          key: "FACULDADE" as CategoryFilter,
                          label: "Faculdade",
                          Icon: GraduationCap,
                          count: categoryCounts.FACULDADE,
                        },
                        {
                          key: "GERAIS" as CategoryFilter,
                          label: "Gerais",
                          Icon: Flame,
                          count: categoryCounts.GERAIS,
                        },
                      ] as {
                        key: CategoryFilter;
                        label: string;
                        Icon: React.ElementType;
                        count: number;
                      }[]
                    ).map(({ key, label, Icon, count }) => {
                      const active = selectedCategory === key;
                      return (
                        <motion.button
                          key={`chip-${key}`}
                          type="button"
                          onClick={() => setSelectedCategory(key)}
                          className={[
                            "relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition shadow-sm overflow-hidden",
                            active
                              ? "text-white border-transparent"
                              : "bg-background text-foreground/80 border-slate-300 hover:bg-muted hover:border-border",
                          ].join(" ")}
                          aria-pressed={active}
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          transition={spring}
                        >
                          {/* BG animado compartilhado (morph entre chips) */}
                          {active && (
                            <motion.span
                              layoutId="chip-bg"
                              className={`absolute inset-0 rounded-full ${activeChipBg(key)}`}
                              transition={spring}
                            />
                          )}
                          {/* Conteúdo do chip */}
                          <span className="relative flex items-center gap-2">
                            <span
                              className={[
                                key === "LOCALIDADE"
                                  ? "bg-rose-600"
                                  : key === "FACULDADE"
                                    ? "bg-sky-600"
                                    : key === "GERAIS"
                                      ? "bg-emerald-600"
                                      : "bg-indigo-600",
                              ].join(" ")}
                            />
                            <Icon className="h-4 w-4" />
                            <span>{label}</span>
                            <span
                              className={
                                active ? "opacity-90" : "text-muted-foreground"
                              }
                            >
                              ({count})
                            </span>
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Info rápida com fade */}
                  <motion.div
                    key={`summary-${selectedCategory}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="mt-4 text-center text-xs text-muted-foreground"
                  >
                    Mostrando{" "}
                    <span className="font-medium text-foreground/80">
                      {filteredPosts.length}
                    </span>{" "}
                    de{" "}
                    <span className="font-medium text-foreground/80">
                      {posts.length}
                    </span>{" "}
                    posts carregados
                  </motion.div>
                </div>
              </div>
            </div>

            {/* MAPA — aparece quando o filtro for "Localidade" */}
            {selectedCategory === "LOCALIDADE" && (
              <div className="mb-6">
                <LocalidadeMap />
              </div>
            )}

            {/* LISTA (timeline com transições e stagger) */}
            <div className="relative">
              {/* Linha da timeline com leve animação ao trocar filtro */}
              <motion.div
                key={`line-${selectedCategory}`}
                initial={{ opacity: 0, scaleY: 0.92, originY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                aria-hidden
                className="absolute left-4 sm:left-5 top-0 bottom-0 w-px sm:w-[2px] bg-border/80 pointer-events-none rounded-full"
              />

              <motion.ul
                key={`list-${selectedCategory}`} // chaves únicas por elemento
                variants={filterListVariants}
                initial="hidden"
                animate="show"
                className="space-y-6"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {loading ? (
                    // Skeletons animados (saem com fade suave)
                    Array(3)
                      .fill(0)
                      .map((_, i) => (
                        <motion.li
                          key={`skeleton-${i}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                          className="relative pl-10 sm:pl-12"
                        >
                          <div className="absolute left-[9px] sm:left-[13px] top-3 h-3.5 w-3.5 rounded-full bg-background border-2 border-indigo-600 shadow" />
                          <div className="p-6 rounded-xl border bg-background shadow-sm space-y-4 animate-pulse">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-24 w-full" />
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-5 w-20" />
                              <Skeleton className="h-5 w-16" />
                            </div>
                          </div>
                        </motion.li>
                      ))
                  ) : posts.length === 0 ? (
                    // Estado vazio geral (sem nenhum post)
                    <motion.li
                      key="empty-all"
                      variants={filterItemVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      className="text-center py-16 bg-background rounded-2xl border shadow-sm"
                    >
                      <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <Sparkles className="h-7 w-7" />
                      </div>
                      <h2 className="text-lg font-semibold">
                        Nenhum post ainda
                      </h2>
                      <p className="text-muted-foreground mt-1 mb-6">
                        Comece a conversa criando o primeiro post.
                      </p>
                      <Button
                        onClick={() => setCreateModalOpen(true)}
                        className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Criar o primeiro post
                      </Button>
                    </motion.li>
                  ) : filteredPosts.length === 0 ? (
                    // Estado vazio para a categoria selecionada
                    <motion.li
                      key="empty-category"
                      variants={filterItemVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      className="text-center py-16 bg-background rounded-2xl border shadow-sm"
                    >
                      <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-slate-100 text-muted-foreground flex items-center justify-center">
                        <Flame className="h-7 w-7" />
                      </div>
                      <h2 className="text-lg font-semibold">
                        Sem posts nesta categoria
                      </h2>
                      <p className="text-muted-foreground mt-1 mb-6">
                        Tente outra categoria ou volte para{" "}
                        <span className="font-medium">Todos</span>.
                      </p>
                      <Button
                        onClick={() => setSelectedCategory("TODOS")}
                        className="rounded-full border-slate-300"
                        variant="outline"
                      >
                        Ver todos os posts
                      </Button>
                    </motion.li>
                  ) : (
                    // Lista de posts com enter/exit + layout suave
                    filteredPosts.map((post: any) => {
                      const borderColor = getCategoryBorder(
                        (post as any).rolePostEnum,
                      );
                      return (
                        <motion.li
                          key={post.postId}
                          id={`post-${post.postId}`}
                          variants={filterItemVariants}
                          initial="hidden"
                          animate="show"
                          exit="exit"
                          layout="position"
                          className="relative pl-10 sm:pl-12"
                        >
                          <div
                            className={`absolute left-[9px] sm:left-[13px] top-5 h-3.5 w-3.5 rounded-full bg-background border-2 ${borderColor} shadow`}
                          />
                          <PostCard
                            post={post}
                            onLike={handleLike}
                            onUnlike={handleUnlike}
                            onDelete={requestDelete}
                          />
                        </motion.li>
                      );
                    })
                  )}

                  {/* Paginação (aparece com fade) */}
                  {!loading && filteredPosts.length > 0 && nextCursor && (
                    <motion.li
                      key="load-more"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex justify-center py-8"
                    >
                      <Button
                        onClick={async () => {
                          const scrollY = window.scrollY;
                          await loadPosts(nextCursor);
                          window.scrollTo({ top: scrollY });
                        }}
                        disabled={loadingMore}
                        variant="outline"
                        className="rounded-full border-slate-300 bg-background text-foreground/80 hover:bg-indigo-100 hover:border-indigo-300 hover:text-indigo-700 transition-all duration-200"
                      >
                        {loadingMore ? "Carregando..." : "Carregar mais"}
                      </Button>
                    </motion.li>
                  )}
                </AnimatePresence>
              </motion.ul>
            </div>
          </motion.div>
        </div>
      </main>

      {/* FAB só no mobile */}
      <Button
        onClick={() => setCreateModalOpen(true)}
        className="sm:hidden fixed right-5 h-12 w-12 rounded-full p-0 shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white z-40"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}
        aria-label="Novo Post"
        title="Novo Post"
      >
        <Plus className="h-5 w-5" />
      </Button>

      {/* Modal Criar Post (API intacta) */}
      <CreatePostModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onPostCreated={() => {
          // marca para rolar até o novo post assim que o feed recarregar
          scrollToNewRef.current = true;
          loadPosts();
        }}
      />

      {/* Dialog de exclusão — discreto e elegante */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(o) => !deleting && setConfirmOpen(o)}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Excluir post?</DialogTitle>
          </DialogHeader>

          <div className="text-sm text-muted-foreground">
            Esta ação não pode ser desfeita. O post será removido do feed.
          </div>

          {/* Preview curto do post */}
          {postToDeleteId && (
            <div className="mt-3 rounded-md border bg-muted p-3 text-sm text-foreground/80">
              {(
                posts.find((p) => p.postId === postToDeleteId)?.content || ""
              ).slice(0, 120)}
              {((posts.find((p) => p.postId === postToDeleteId)?.content || "")
                .length || 0) > 120
                ? "…"
                : ""}
            </div>
          )}

          <div className="mt-5 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
              className="rounded-full"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmDelete}
              disabled={deleting}
              className="rounded-full bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleting ? "Excluindo…" : "Excluir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Feed;

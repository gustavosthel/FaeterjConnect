// src/pages/Profile.tsx
import { useEffect, useMemo, useState, type ComponentProps } from "react";
import { useParams } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  MotionConfig,
  type Variants,
} from "framer-motion";
import { Edit2, Save, X, Trash2 } from "lucide-react";

import { Sidebar } from "@/components/Sidebar";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usersApi, type UserProfile } from "@/api/users";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

import { PostCard } from "@/components/PostCard";
import { UserAvatar } from "@/components/UserAvatar";

// ✅ Posts API tipado
import { postsApi, type Post as PostType } from "@/api/posts";

// ===================== Helpers de formatação =====================
function formatEnumGeneric(value?: string): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (s) => s.toUpperCase());
}

function formatTurno(turno?: string): string {
  switch ((turno || "").toUpperCase()) {
    case "MANHA":
      return "Manhã";
    case "TARDE":
      return "Tarde";
    case "NOITE":
      return "Noite";
    default:
      return formatEnumGeneric(turno);
  }
}

// ===================== Motion Variants =====================
const listVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.06,
      duration: 0.25,
      ease: "easeOut",
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: "easeIn" } },
};

function getCategoryBorder(role?: string) {
  switch (role) {
    case "IMPORTANTE":
      return "border-rose-500";
    case "ANUNCIO":
      return "border-amber-500";
    case "DICA":
      return "border-emerald-500";
    default:
      return "border-slate-300";
  }
}

// ===================== Timeline de Posts do Usuário =====================
function UserPostsTimeline({
  userId,
  isOwnProfile,
}: {
  userId: string;
  isOwnProfile: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const LIMIT = 10;
  const keyBase = useMemo(() => `user-posts-${userId}`, [userId]);

  async function fetchPage(cursor?: string) {
    const data = await postsApi.getPostsByAuthor(userId, LIMIT, cursor);
    return data;
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchPage();
        if (!mounted) return;
        setPosts(data.items);
        setNextCursor(data.nextCursor ?? null);
      } catch {
        toast.error("Erro ao carregar posts do usuário");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userId]);

  async function loadMore() {
    if (!nextCursor) return;
    try {
      setLoadingMore(true);
      const data = await fetchPage(nextCursor);
      setPosts((prev) => [...prev, ...data.items]);
      setNextCursor(data.nextCursor ?? null);
    } catch {
      toast.error("Erro ao carregar mais posts");
    } finally {
      setLoadingMore(false);
    }
  }

  // Handlers integrados (like/unlike/delete)
  async function handleLike(postId: string) {
    try {
      const res = await postsApi.likePost(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.postId === res.postId
            ? { ...p, likeCount: res.likeCount, likedByMe: res.likedByMe }
            : p,
        ),
      );
    } catch {
      toast.error("Não foi possível curtir o post.");
    }
  }

  async function handleUnlike(postId: string) {
    try {
      const res = await postsApi.unlikePost(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.postId === res.postId
            ? { ...p, likeCount: res.likeCount, likedByMe: res.likedByMe }
            : p,
        ),
      );
    } catch {
      toast.error("Não foi possível remover a curtida.");
    }
  }

  async function handleDelete(postId: string) {
    if (!isOwnProfile) return; // segurança básica no front
    try {
      await postsApi.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.postId !== postId));
      toast.success("Post removido.");
    } catch {
      toast.error("Erro ao remover post.");
    }
  }

  return (
    <div className="relative">
      {/* Linha vertical da timeline */}
       <motion.div
          key={`line-${keyBase}`}
          initial={{ opacity: 0, scaleY: 0.92, originY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden
          className="absolute left-4 sm:left-5 top-0 bottom-0 w-px sm:w-[2px] bg-border/80 pointer-events-none rounded-full"
        />

      <motion.ul
        key={`list-${keyBase}`}
        variants={listVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <AnimatePresence mode="wait" initial={false}>
          {loading ? (
            Array(3)
              .fill(0)
              .map((_, i) => (
                <motion.li
                  key={`skeleton-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="relative pl-10 sm:pl-12"
                >
                  <div className="absolute left-[9px] sm:left-[13px] top-3 h-3.5 w-3.5 rounded-full bg-background border-2 border-indigo-600 shadow" />
                  <div className="p-6 rounded-xl border bg-background shadow-sm space-y-4 animate-pulse">
                    <div className="h-5 w-40 bg-slate-200 rounded" />
                    <div className="h-24 w-full bg-slate-200 rounded" />
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-20 bg-slate-200 rounded" />
                      <div className="h-5 w-16 bg-slate-200 rounded" />
                    </div>
                  </div>
                </motion.li>
              ))
          ) : posts.length === 0 ? (
            <motion.li
              key="empty"
              variants={itemVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="text-center py-16 bg-background rounded-2xl border shadow-sm"
            >
              <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-slate-100 text-muted-foreground flex items-center justify-center">
                <svg
                  className="h-7 w-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" stroke="currentColor" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold">Nenhum post ainda</h2>
              <p className="text-muted-foreground mt-1">
                Este usuário ainda não publicou nada.
              </p>
            </motion.li>
          ) : (
            posts.map((post) => (
              <motion.li
                key={post.postId}
                id={`post-${post.postId}`}
                variants={itemVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                layout="position"
                className="relative pl-10 sm:pl-12"
              >
                {/* Botão de excluir fora do PostCard (absoluto no item) */}
                {isOwnProfile && (
                  <Button
                    onClick={() => handleDelete(post.postId)}
                    variant="ghost"
                    size="icon"
                    title="Excluir post"
                    className="absolute right-3 top-3 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}

                <div
                  className={`absolute left-[9px] sm:left-[13px] top-5 h-3.5 w-3.5 rounded-full bg-background border-2 ${getCategoryBorder(
                    post.rolePostEnum,
                  )} shadow`}
                />

                <PostCard
                  post={post}
                  onLike={() => handleLike(post.postId)}
                  onUnlike={() => handleUnlike(post.postId)}
                  // ❌ não passamos onDelete para evitar UI duplicada dentro do PostCard
                />
              </motion.li>
            ))
          )}

          {!loading && posts.length > 0 && nextCursor && (
            <motion.li
              key="load-more"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex justify-center py-8"
            >
              <Button
                onClick={loadMore}
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
  );
}

// ===================== Página de Perfil =====================
const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    turnoEnum: "MANHA" as string,
  });

  const currentUser = useAuthStore((state) => state.user);
  const isOwnProfile = currentUser?.userId === userId;

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadUser = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await usersApi.getUser(userId);
      setUser(data);
      setFormData({
        username: data.username,
        email: data.email,
        password: "",
        turnoEnum: (data as any).turnoEnum || "MANHA",
      });
    } catch {
      toast.error("Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!userId) return;
    try {
      setSaving(true);
      const updateData: any = {
        username: formData.username,
        email: formData.email,
        turnoEnum: formData.turnoEnum, // backend recebe UPPERCASE
      };
      if (formData.password) updateData.password = formData.password;

      const data = await usersApi.updateUser(userId, updateData);
      setUser(data);
      setEditing(false);
      setFormData((prev) => ({ ...prev, password: "" }));
      toast.success("Perfil atualizado com sucesso!");
    } catch {
      toast.error("Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1 ml-64 p-6">
          <LoadingScreen />
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1 ml-64 p-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Usuário não encontrado</p>
          </div>
        </main>
      </div>
    );
  }

  const avatarUrl = (user as any).avatarUrl as string | undefined;
  const coverUrl = (user as any).coverUrl as string | undefined;
  const followersCount = (user as any).followersCount as number | undefined;
  const followingCount = (user as any).followingCount as number | undefined;
  const joinedAt = (user as any).createdAt as string | undefined;

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen w-full bg-gradient-to-br from-slate-100 via-white to-indigo-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-slate-900">
        <Sidebar />

        <main className="flex-1 ml-64 p-0 sm:p-6">
          {/* Header estilo X */}
          <section className="mx-auto w-full max-w-2xl sm:max-w-3xl">
            <div className="relative">
              <div className="w-full aspect-[3/1] sm:aspect-[3.5/1] bg-slate-200 rounded-b-xl overflow-hidden">
                {coverUrl && (
                  <img
                    src={coverUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="px-4 sm:px-6">
                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="-mt-12 flex items-end justify-between"
                >
                  <div className="flex items-end gap-3">
                    {/* Avatar responsivo (96px mobile / 112px sm+) */}
                    <div className="relative">
                      <UserAvatar
                        name={user.username}
                        seed={(user as any).userId ?? userId!}
                        src={avatarUrl ?? null}
                        size={96}
                        className="border-4 border-white shadow ring-1 ring-neutral-200 bg-background sm:hidden"
                      />
                      <UserAvatar
                        name={user.username}
                        seed={(user as any).userId ?? userId!}
                        src={avatarUrl ?? null}
                        size={112}
                        className="border-4 border-white shadow ring-1 ring-neutral-200 bg-background hidden sm:inline-flex"
                      />
                    </div>

                    <div className="pb-2">
                      <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                        {user.username}
                      </h1>
                      <p className="text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <div className="pb-2 pr-2">
                    {isOwnProfile ? (
                      <Button
                        variant="default"
                        size="sm"
                        className="rounded-full"
                        onClick={() => setEditing((v) => !v)}
                      >
                        {editing ? (
                          <>
                            <X className="w-4 h-4 mr-2" />
                            Cancelar
                          </>
                        ) : (
                          <>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Editar perfil
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                      >
                        Seguir
                      </Button>
                    )}
                  </div>
                </motion.div>

                {/* Meta e contadores */}
                <div className="mt-3 px-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {joinedAt && (
                      <span>
                        Entrou em {new Date(joinedAt).toLocaleDateString()}
                      </span>
                    )}
                    {(user as any).role && (
                      <span>
                        Função:{" "}
                        <span className="text-foreground/80 font-medium">
                          {formatEnumGeneric((user as any).role)}
                        </span>
                      </span>
                    )}
                    {user.turnoEnum && (
                      <span>
                        Turno:{" "}
                        <span className="text-foreground/80 font-medium">
                          {formatTurno(user.turnoEnum)}
                        </span>
                      </span>
                    )}
                  </div>

                  {(typeof followingCount === "number" ||
                    typeof followersCount === "number") && (
                    <div className="flex items-center gap-4 text-sm">
                      {typeof followingCount === "number" && (
                        <span>
                          <strong className="text-slate-900">
                            {followingCount}
                          </strong>{" "}
                          seguindo
                        </span>
                      )}
                      {typeof followersCount === "number" && (
                        <span>
                          <strong className="text-slate-900">
                            {followersCount}
                          </strong>{" "}
                          seguidores
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Card de Edição / Detalhes (versão compacta e minimal) */}
          <section className="mx-auto w-full max-w-2xl sm:max-w-3xl px-3 sm:px-4 mt-3">
            <Card className="shadow-none border border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-[15px] font-semibold tracking-tight">
                    Perfil do Usuário
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 sm:space-y-6">
                {editing ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="username"
                          className="text-xs text-muted-foreground"
                        >
                          Nome de usuário
                        </Label>
                        <Input
                          id="username"
                          value={formData.username}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              username: e.target.value,
                            })
                          }
                          placeholder="seu_nome"
                          className="h-9 text-sm"
                        />
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          Seu identificador público (@username).
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="email"
                          className="text-xs text-muted-foreground"
                        >
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="voce@exemplo.com"
                          className="h-9 text-sm"
                        />
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          Usado para login e notificações.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="password"
                          className="text-xs text-muted-foreground"
                        >
                          Nova Senha
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                          placeholder="••••••••"
                          className="h-9 text-sm"
                        />
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          Deixe em branco para manter a atual.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="turno"
                          className="text-xs text-muted-foreground"
                        >
                          Turno
                        </Label>
                        <Select
                          value={formData.turnoEnum}
                          onValueChange={(value) =>
                            setFormData({ ...formData, turnoEnum: value })
                          }
                        >
                          <SelectTrigger id="turno" className="h-9 text-sm">
                            <SelectValue placeholder="Selecione o turno" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MANHA">Manhã</SelectItem>
                            <SelectItem value="NOITE">Noite</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          Informe seu turno preferencial.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleUpdate}
                        disabled={saving}
                        className="h-9 px-3 rounded-full border border-primary/25 bg-transparent text-primary hover:bg-primary/10 disabled:opacity-60"
                      >
                        <Save className="w-3.5 h-3.5 mr-2" />
                        <span className="text-sm">
                          {saving ? "Salvando..." : "Salvar alterações"}
                        </span>
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Nome de usuário
                        </Label>
                        <p className="text-sm font-medium text-foreground">
                          {user.username}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Email
                        </Label>
                        <p className="text-sm font-medium text-foreground">
                          {user.email}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Função
                        </Label>
                        <p className="text-sm font-medium text-foreground">
                          {formatEnumGeneric((user as any).role)}
                        </p>
                      </div>

                      {user.turnoEnum && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Turno
                          </Label>
                          <p className="text-sm font-medium text-foreground">
                            {formatTurno(user.turnoEnum)}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Timeline de posts apenas do usuário */}
          <section className="mx-auto w-full max-w-2xl sm:max-w-3xl px-4 sm:px-6 mt-6 pb-8">
            <UserPostsTimeline userId={userId!} isOwnProfile={!!isOwnProfile} />
          </section>
        </main>
      </div>
    </MotionConfig>
  );
};

export default Profile;

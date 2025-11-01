import { useState, useCallback, useRef, useEffect } from "react";
import { Loader2, Tag, X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { postsApi } from "@/api/posts";
import { toast } from "sonner";

import { UserAvatar } from "@/components/UserAvatar";
import { useAuthStore } from "@/store/useAuthStore";
import { getUserSeedFromProfile } from "@/utils/avatarColor";
import { useMobileVh } from "@/hooks/useMobileVh";

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

type Category = "LOCALIDADE" | "FACULDADE" | "GERAIS";

function AutoResizeTextarea(
  props: React.ComponentProps<typeof Textarea> & {
    minRows?: number;
    maxRows?: number;
  },
) {
  const { minRows = 5, maxRows = 12, value, onChange, style, ...rest } = props;
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const line = parseFloat(getComputedStyle(el).lineHeight || "20");
    const minH = minRows * line;
    const maxH = maxRows * line;
    el.style.height = Math.min(Math.max(el.scrollHeight, minH), maxH) + "px";
  }, [minRows, maxRows]);

  useEffect(() => {
    resize();
  }, [value, resize]);

  return (
    <Textarea
      ref={ref}
      value={value}
      onChange={(e) => {
        onChange?.(e);
        requestAnimationFrame(resize);
      }}
      style={{ ...style, overflow: "auto", resize: "none" }}
      {...rest}
    />
  );
}

export const CreatePostModal = ({
  open,
  onClose,
  onPostCreated,
}: CreatePostModalProps) => {
  useMobileVh(); // Altura real no mobile

  const [content, setContent] = useState("");
  const [rolePostEnum, setRolePostEnum] = useState<Category>("GERAIS");
  const [submitting, setSubmitting] = useState(false);

  const user = useAuthStore((s) => s.user);
  const seed = getUserSeedFromProfile(user);

  const charLimit = 250;
  const progress = Math.min(content.length / charLimit, 1);
  const prefersReducedMotion = useReducedMotion();

  const canSubmit =
    !!user && !!content.trim() && content.length <= charLimit && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Você precisa estar logado para publicar.");
      return;
    }
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      await postsApi.createPost({ content: content.trim(), rolePostEnum });
      toast.success("Post criado com sucesso!");
      setContent("");
      setRolePostEnum("GERAIS");
      onPostCreated();
      onClose();
    } catch {
      toast.error("Erro ao criar post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    const isCmdOrCtrl = e.metaKey || e.ctrlKey;
    if (isCmdOrCtrl && e.key === "Enter" && canSubmit) {
      e.preventDefault();
      const form = (e.currentTarget as HTMLTextAreaElement).closest("form");
      form?.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true }),
      );
    }
  };

  const CATEGORIES: Array<{ value: Category; label: string; hint: string }> = [
    {
      value: "LOCALIDADE",
      label: "Localidade (Campus/Unidade)",
      hint: "Use para campus, unidades ou cidades",
    },
    {
      value: "FACULDADE",
      label: "Faculdade (Curso/Depto)",
      hint: "Assuntos de cursos e departamentos",
    },
    {
      value: "GERAIS",
      label: "Geral (Todos)",
      hint: "Conteúdos abertos a toda a comunidade",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        // Mantém o seu visual: mobile fullscreen, desktop central
        className="
          p-0 overflow-hidden 
          w-[100vw] max-w-[100vw]
          h-[calc(var(--app-vh,1vh)*100)]
          sm:h-auto sm:max-w-[560px] sm:rounded-2xl
        "
      >
        <div className="h-full p-[1px]  rounded-none sm:rounded-2xl">
          <motion.form
            onSubmit={handleSubmit}
            className="h-full flex flex-col bg-background rounded-none sm:rounded-2xl overflow-hidden"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{
              paddingTop: "max(0px, env(safe-area-inset-top))",
              paddingBottom: "max(0px, env(safe-area-inset-bottom))",
              paddingLeft: "max(0px, env(safe-area-inset-left))",
              paddingRight: "max(0px, env(safe-area-inset-right))",
            }}
          >
            {/* Header */}
            <DialogHeader className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="px-4 sm:px-6 pt-4 pb-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <DialogTitle className="text-base sm:text-xl font-semibold truncate">
                    Criar novo post
                  </DialogTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Compartilhe uma atualização com a comunidade.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="h-11 w-11 shrink-0 rounded-full"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </DialogHeader>

            {/* Corpo rolável */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 space-y-5 min-w-0">
              {/* Linha do usuário + chips */}
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                {/* Avatar */}
                <UserAvatar
                  name={user?.username}
                  seed={seed}
                  src={user?.profileImageUrl ?? null}
                  size={44}
                  title={user?.username}
                  className="shrink-0"
                />

                {/* Chips — agora SEM rolagem, com quebra de linha */}
                <div className="flex-1 basis-0 min-w-0">
                  <div
                    role="tablist"
                    aria-label="Categorias de publicação"
                    className="
                      w-full min-w-0
                      flex flex-wrap items-center
                      gap-x-2 gap-y-2            /* espaço entre linhas e colunas */
                    "
                  >
                    {CATEGORIES.map((c) => {
                      const active = rolePostEnum === c.value;
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setRolePostEnum(c.value)}
                          role="tab"
                          aria-selected={active}
                          aria-label={c.hint}
                          className={`inline-flex items-center gap-1.5 rounded-full
                            px-3 py-1.5 text-[11px] sm:px-3.5 sm:py-2 sm:text-xs font-medium border transition-colors
                            min-h-[38px] sm:min-h-[44px]
                            ${active ? "bg-indigo-600 text-white border-indigo-600" : "bg-background text-foreground/80 border-slate-300 hover:bg-muted"}
                          `}
                        >
                          <Tag className="h-3.5 w-3.5" />
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="min-w-0">
                <label htmlFor="post-content" className="sr-only">
                  Conteúdo do post
                </label>
                <AutoResizeTextarea
                  id="post-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder="O que você está pensando?"
                  className="w-full min-h-[120px] sm:min-h-[160px] resize-none"
                  disabled={submitting}
                  maxLength={charLimit + 200}
                />

                {/* Dica + contador */}
                {/* Dica + contador */}
<div className="mt-2 flex flex-wrap items-center justify-between gap-2">
  <span className="text-xs text-muted-foreground flex-1 min-w-0 whitespace-normal break-words">
    Dica:{" "}
    <kbd className="px-1 py-0.5 rounded border border-input bg-muted text-foreground/80 font-mono text-[11px] leading-none shadow-sm">
      Ctrl
    </kbd>
    /
    <kbd className="px-1 py-0.5 rounded border border-input bg-muted text-foreground/80 font-mono text-[11px] leading-none shadow-sm">
      ⌘
    </kbd>{" "}
    +{" "}
    <kbd className="px-1 py-0.5 rounded border border-input bg-muted text-foreground/80 font-mono text-[11px] leading-none shadow-sm">
      Enter
    </kbd>{" "}
    para publicar
  </span>

  <span
    className={`text-xs shrink-0 ${
      content.length > charLimit
        ? "text-destructive font-medium"
        : "text-muted-foreground"
    }`}
    aria-live="polite"
  >
    {content.length}/{charLimit}
  </span>
</div>

{/* Barra de progresso */}
<div className="mt-1 h-2 w-full rounded-full bg-muted overflow-hidden">
  <div
    className={`h-full rounded-full transition-[width,background-color] duration-300 ${
      content.length > charLimit ? "bg-destructive" : "bg-primary"
    }`}
    style={{ width: `${progress * 100}%` }}
  />
</div>
              </div>
            </div>

            {/* Footer — empilha no mobile, lado a lado no desktop */}
            <div className="sticky bottom-0 z-20 border-t bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="px-4 sm:px-6 py-3 grid grid-cols-1 gap-2 sm:flex sm:items-center sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={submitting}
                  className="min-h-[44px] w-full sm:w-auto sm:flex-none"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="min-h-[44px] w-full sm:w-auto sm:flex-none"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publicando...
                    </>
                  ) : (
                    "Publicar"
                  )}
                </Button>
              </div>
            </div>
          </motion.form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

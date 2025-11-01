import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  MessageCircle,
  User as UserIcon,
  Settings,
  LogOut,
  Zap,
  X,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Transition,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";

type RailState = { y: number; h: number };

export const Sidebar = () => {
  const { logout, user } = useAuthStore();
  const [openMobile, setOpenMobile] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const location = useLocation();

  // refs para medir posição dos itens
  const navRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // posição/altura da barra animada
  const [rail, setRail] = useState<RailState>({ y: 0, h: 0 });

  const navItems = useMemo(
    () => [
      { icon: Home, label: "Feed", path: "/feed" },
      { icon: MessageCircle, label: "Mensagens", path: "/chat" },
      { icon: UserIcon, label: "Perfil", path: `/profile/${user?.userId}` },
      { icon: Settings, label: "Configurações", path: "/settings" },
    ],
    [user?.userId],
  );

  // ===== Scroll lock do fundo no mobile =====
  const scrollYRef = useRef(0);
  useEffect(() => {
    if (!openMobile) return;

    scrollYRef.current = window.scrollY;
    const body = document.body;
    const html = document.documentElement;

    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
      overscrollBehaviorY: html.style.overscrollBehaviorY,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollYRef.current}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    html.style.overscrollBehaviorY = "none";

    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      html.style.overscrollBehaviorY = prev.overscrollBehaviorY;
      window.scrollTo(0, scrollYRef.current);
    };
  }, [openMobile]);

  // Fechar com ESC
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setOpenMobile(false);
  }, []);

  // Abrir/fechar por eventos globais (para usar o botão do header)
  const onOpen = useCallback(() => setOpenMobile(true), []);
  const onClose = useCallback(() => setOpenMobile(false), []);

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("sidebar:open", onOpen as EventListener);
    window.addEventListener("sidebar:close", onClose as EventListener);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("sidebar:open", onOpen as EventListener);
      window.removeEventListener("sidebar:close", onClose as EventListener);
    };
  }, [onKeyDown, onOpen, onClose]);

  // === Transição do rail: suave, sem overshoot visível
  const railSpring: Transition = prefersReducedMotion
    ? { type: "tween", duration: 0 }
    : { type: "spring", stiffness: 480, damping: 40, mass: 0.6 };

  // Calcula a posição do rail com base no item ativo (medição real, sem "cair")
  const recalcRail = useCallback(() => {
    const currentPath =
      navItems.find((i) => location.pathname.startsWith(i.path))?.path ??
      navItems[0]?.path;

    const el = itemRefs.current[currentPath];
    const navEl = navRef.current;
    if (!el || !navEl) return;

    const elRect = el.getBoundingClientRect();
    const navRect = navEl.getBoundingClientRect();

    // Altura do rail: levemente menor que o item (inset 4px)
    const targetH = Math.max(24, Math.round(elRect.height - 8));
    // Posição Y relativa ao container, centralizando o rail no item
    const targetY = Math.round(
      elRect.top - navRect.top + (elRect.height - targetH) / 2,
    );

    setRail({ y: targetY, h: targetH });
  }, [location.pathname, navItems]);

  // Recalcula ao trocar de rota e ao redimensionar (e ao abrir o drawer)
  useEffect(() => {
    recalcRail();
    const onResize = () => recalcRail();
    window.addEventListener("resize", onResize);
    const id = window.setTimeout(recalcRail, 0); // pós-paint
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(id);
    };
  }, [recalcRail, openMobile]);

  const setItemRef = (path: string) => (el: HTMLDivElement | null) => {
    itemRefs.current[path] = el;
  };

  const NavList = ({ onItemClick }: { onItemClick?: () => void }) => (
    <div ref={navRef} className="relative flex-1">
      {/* Rail único animado (sempre presente) */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute left-0 w-[3px] rounded-r bg-primary"
        initial={false}
        animate={{ y: rail.y, height: rail.h }}
        transition={railSpring}
      />
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.path}
              ref={setItemRef(item.path)}
              className="relative"
            >
              <NavLink
                to={item.path}
                onClick={onItemClick}
                className={({ isActive }) =>
                  [
                    "relative flex items-center gap-3 rounded-md px-3 h-10", // altura fixa ajuda a fluidez
                    // Hover leve e minimal:
                    "transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-foreground hover:bg-primary/5 hover:text-primary/90",
                    // Foco visível
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  ].join(" ")
                }
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium"> {item.label} </span>
              </NavLink>
            </div>
          );
        })}
      </nav>
    </div>
  );

  const UserCard = () => (
    <div className="border-t border-border pt-3">
      <Button
        onClick={logout}
        variant="outline"
        className="w-full justify-start transition-colors hover:bg-primary/5 hover:text-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label="Sair da conta"
      >
        <LogOut className="w-5 h-5 mr-2" />
        Sair
      </Button>
    </div>
  );

  return (
    <>
      {/* Sidebar Desktop (fixa) */}
      <motion.aside
        initial={{ x: -16, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
        className="hidden md:flex fixed left-0 top-0 h-screen w-64 border-r border-border bg-card p-4 flex-col"
      >
        <div className="flex items-center gap-2 mb-6 px-1">
          <div className="w-7 h-7 grid place-items-center rounded-md bg-primary text-primary-foreground">
            <Zap className="w-4 h-4" />
          </div>
          <span className="text-lg font-semibold">FaeterjConnect</span>
        </div>

        <NavList />
        <UserCard />
      </motion.aside>

      {/* Drawer Mobile (abre por evento) */}
      <AnimatePresence>
        {openMobile && (
          <>
            {/* Overlay (bloqueia interação e não deixa fundo mexer) */}
            <motion.div
              key="overlay"
              className="md:hidden fixed inset-0 z-50 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenMobile(false)}
            />

            {/* Drawer */}
            <motion.aside
              key="drawer"
              className="md:hidden fixed left-0 top-0 z-50 h-screen w-72 max-w-[85vw] border-r border-border bg-card p-4 flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-label="Menu lateral"
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.18,
                ease: "easeOut",
              }}
            >
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 grid place-items-center rounded-md bg-primary text-primary-foreground">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="text-base font-semibold">
                    FaeterjConnect
                  </span>
                </div>
                <button
                  onClick={() => setOpenMobile(false)}
                  className="inline-flex items-center justify-center rounded-md p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  aria-label="Fechar menu"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <NavList onItemClick={() => setOpenMobile(false)} />
              <div className="mt-3">
                <UserCard />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const NotFound: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <main className="w-full max-w-md text-center space-y-6">
        {/* Badge 404 circular e discreto */}
        <div className="mx-auto h-24 w-24 sm:h-28 sm:w-28 rounded-full border border-border/60 bg-muted/60 grid place-items-center">
          <span className="text-3xl sm:text-4xl font-semibold text-foreground/90">
            404
          </span>
        </div>

        {/* Título e descrição (tipografia compacta) */}
        <header className="space-y-2">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
            Página não encontrada
          </h1>
          <p
            className="text-sm text-muted-foreground max-w-sm mx-auto"
            aria-live="polite"
          >
            Oops! A rota{" "}
            <code className="px-1 rounded bg-muted/60">
              {location.pathname}
            </code>{" "}
            não existe. Verifique o endereço ou volte para a página inicial.
          </p>
        </header>

        {/* Ações minimalistas */}
        <div className="flex items-center justify-center gap-3">
          {/* Voltar */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-muted/50 border border-transparent transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Voltar
          </button>

          {/* Home */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-md border border-border/70 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
          >
            <HomeIcon className="h-4 w-4" />
            Ir para Home
          </Link>
        </div>

        {/* Dica opcional / suporte */}
        <p className="text-[11px] text-muted-foreground">
          Se você acredita que isso é um erro, tente atualizar a página ou
          retornar mais tarde.
        </p>
      </main>
    </div>
  );
};

export default NotFound;

/* ====== Ícones inline (sem libs externas) ====== */
function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 11 9-8 9 8" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function ArrowLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

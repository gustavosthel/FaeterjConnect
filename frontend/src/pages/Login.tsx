// src/pages/Login.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

function isUuid(v: unknown): v is string {
  if (typeof v !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );
}

const Login = () => {
  // ===== LÓGICA ORIGINAL (inalterada) =====
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authApi.login({ email, password });
      if (!isUuid(response.userId)) {
        throw new Error(
          `userId inválido (esperado UUID). Recebido: ${String(response.userId)}`,
        );
      }

      setAuth(
        {
          userId: response.userId,
          username: response.username,
          email: response.email,
          roleEnum: response.roleEnum,
          turnoEnum: response.turnoEnum,
          profileImageUrl: null,
        },
        response.token,
      );

      toast.success("Login realizado com sucesso!");
      navigate("/feed");
    } catch (err: any) {
      logout();
      const msg =
        err?.message || err?.response?.data?.message || "Erro ao fazer login";
      toast.error(msg);
      console.error("[Login] erro:", err);
    } finally {
      setLoading(false);
    }
  };

  // ===== SOMENTE ESTILO / VISUAL ABAIXO =====
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4">
      {/* Detalhe sutil de fundo com a cor do site (sem pesar) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          background:
            "radial-gradient(600px 200px at 50% 0%, hsl(var(--primary)) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Marca minimalista */}
        <div className="text-center mb-7">
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="inline-grid place-items-center mb-3 h-12 w-12 rounded-xl border border-primary/25 bg-primary/7 text-primary"
            // dica: se quiser circular, troque rounded-xl por rounded-full
          >
            <Zap className="w-5 h-5" />
          </motion.div>

          <h1 className="text-xl font-semibold tracking-tight">
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              FaeterjConnect
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Entre e conecte-se
          </p>
        </div>

        <Card className="border border-border/70 shadow-none">
          {/* Accent line sutil no topo do card */}
          <div
            className="h-[2px] w-16 bg-primary/40 rounded-full mx-auto mt-3"
            aria-hidden
          />
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Login</CardTitle>
            <CardDescription className="text-xs">
              Entre com suas credenciais
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  disabled={loading}
                  className="h-10 text-sm focus-visible:ring-1 focus-visible:ring-primary/35"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-xs text-muted-foreground"
                >
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="h-10 text-sm focus-visible:ring-1 focus-visible:ring-primary/35"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 rounded-md border border-primary/25 bg-transparent text-primary hover:bg-primary/10 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Não tem uma conta?{" "}
                <Link
                  to="/register"
                  className="text-primary hover:underline underline-offset-4"
                >
                  Cadastre-se
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authApi } from "@/api/auth";
import { toast } from "sonner";

const Register = () => {
  // ===== LÓGICA ORIGINAL (inalterada) =====
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    roleEnum: "ALUNO",
    turnoEnum: "MANHA",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authApi.register(formData);
      toast.success("Cadastro realizado com sucesso!");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao fazer cadastro");
    } finally {
      setLoading(false);
    }
  };

  // ===== SOMENTE ESTILO / VISUAL ABAIXO =====
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4">
      {/* Detalhe sutil de fundo usando a cor primária */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          background:
            "radial-gradient(600px 200px at 50% -10%, hsl(var(--primary)) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Marca minimalista (mesma linguagem do Login) */}
        <div className="text-center mb-7">
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="inline-grid place-items-center mb-3 h-12 w-12 rounded-xl border border-primary/25 bg-primary/7 text-primary"
          >
            <Zap className="w-5 h-5" />
          </motion.div>

          <h1 className="text-xl font-semibold tracking-tight">
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              FaeterjConnect
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Crie sua conta</p>
        </div>

        <Card className="border border-border/70 shadow-none">
          {/* Accent line sutil no topo do card */}
          <div
            className="h-[2px] w-16 bg-primary/40 rounded-full mx-auto mt-3"
            aria-hidden
          />
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cadastro</CardTitle>
            <CardDescription className="text-xs">
              Preencha os dados para criar sua conta
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="seu_usuario"
                  required
                  disabled={loading}
                  className="h-10 text-sm focus-visible:ring-1 focus-visible:ring-primary/35"
                />
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
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  minLength={7}
                  className="h-10 text-sm focus-visible:ring-1 focus-visible:ring-primary/35"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-xs text-muted-foreground">
                  Função
                </Label>
                <Select
                  value={formData.roleEnum}
                  onValueChange={(value) =>
                    setFormData({ ...formData, roleEnum: value })
                  }
                >
                  <SelectTrigger id="role" className="h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALUNO">Aluno</SelectItem>
                    <SelectItem value="PROFESSOR">Professor</SelectItem>
                    <SelectItem value="SECRETARIA">Secretaria</SelectItem>
                  </SelectContent>
                </Select>
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
                  <SelectTrigger id="turno" className="h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANHA">Manhã</SelectItem>
                    <SelectItem value="NOITE">Noite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 rounded-md border border-primary/25 bg-transparent text-primary hover:bg-primary/10 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  "Criar conta"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Já tem uma conta?{" "}
                <Link
                  to="/login"
                  className="text-primary hover:underline underline-offset-4"
                >
                  Faça login
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;

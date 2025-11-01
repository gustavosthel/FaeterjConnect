import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

import {
  Shield,
  Bell,
  Palette,
  Accessibility,
  Settings as SettingsIcon,
  Mail,
  Moon,
  Sun,
  MonitorSmartphone,
} from "lucide-react";

// util simples
function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

type SectionKey =
  | "conta"
  | "privacidade"
  | "notificacoes"
  | "aparencia"
  | "acessibilidade";

const sections: { key: SectionKey; label: string; icon: React.ElementType }[] =
  [
    { key: "conta", label: "Conta", icon: SettingsIcon },
    { key: "privacidade", label: "Privacidade", icon: Shield },
    { key: "notificacoes", label: "Notificações", icon: Bell },
    { key: "aparencia", label: "Aparência", icon: Palette },
    { key: "acessibilidade", label: "Acessibilidade", icon: Accessibility },
  ];

// 🎨 estilos de botões (minimalistas) — só constantes locais (sem novo componente)
const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-md text-sm h-9 px-3 " +
  "transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30 " +
  "disabled:opacity-60 disabled:cursor-not-allowed shadow-none";

const btnOutline =
  "border border-border/60 bg-transparent text-foreground/90 " +
  "hover:bg-muted/50 hover:text-foreground";

const btnSoftPrimary =
  "border border-primary/25 bg-transparent text-primary " +
  "hover:bg-primary/10";

const btnGhost = "bg-transparent text-foreground/80 hover:bg-muted/40";

const btnDanger =
  "border border-destructive/25 bg-transparent text-destructive " +
  "hover:bg-destructive/10";


import { useTheme } from "@/theme/ThemeProvider"; // ajuste o caminho se preciso

export default function Settings() {
  // 👇 adicione esta linha junto com seus outros useState/useMemo
  const { theme, setTheme, accent, setAccent, fontSize, setFontSize } = useTheme();

  const [active, setActive] = useState<SectionKey>("conta");
  const motionProps = useMemo(
    () => ({
      initial: { opacity: 0, y: 4 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.16 },
    }),
    [],
  );


  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-slate-100 via-white to-indigo-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-slate-900">
      <Sidebar />

      <main className="flex-1 ml-64 p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mx-auto w-full max-w-5xl"
        >
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-indigo-700">
              Configurações
            </h1>
            <p className="text-xs text-muted-foreground">
              Personalize sua experiência no FaeterjConnect.
            </p>
          </header>

          {/* Navegação de seções (mobile: select, desktop: lista lateral) */}
          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            {/* Mobile selector */}
            <div className="lg:hidden">
              <Label htmlFor="section" className="sr-only">
                Seção
              </Label>
              <Select
                value={active}
                onValueChange={(v: SectionKey) => setActive(v)}
              >
                <SelectTrigger
                  id="section"
                  className="w-full"
                  aria-label="Seção de configurações"
                >
                  <SelectValue placeholder="Selecione uma seção" />
                </SelectTrigger>
                <SelectContent align="start">
                  {sections.map(({ key, label, icon: Icon }) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Desktop sub-nav à esquerda (mais minimal) */}
            <aside className="hidden lg:block">
              <nav className="sticky top-4">
                <ul className="space-y-1">
                  {sections.map(({ key, label, icon: Icon }) => {
                    const isActive = active === key;
                    return (
                      <li key={key}>
                        <button
                          onClick={() => setActive(key)}
                          className={cn(
                            "w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                            "border",
                            isActive
                              ? "border-border/60 bg-muted/50 text-foreground"
                              : "border-transparent text-foreground/70 hover:bg-muted/40 hover:text-foreground",
                          )}
                          aria-current={isActive ? "page" : undefined}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="truncate">{label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </aside>

            {/* Conteúdo */}
            <section className="min-w-0">
              {active === "conta" && (
                <motion.div {...motionProps} className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Conta</CardTitle>
                      <CardDescription>
                        Dados de acesso e preferências de conta.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">E-mail</Label>
                          <div className="flex gap-2">
                            <Input
                              id="email"
                              type="email"
                              placeholder="seuemail@exemplo.com"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              className={cn(btnBase, btnSoftPrimary)}
                              aria-label="Verificar e-mail"
                            >
                              <Mail className="h-4 w-4" />
                              Verificar
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="idioma">Idioma</Label>
                          <Select defaultValue="pt-BR">
                            <SelectTrigger id="idioma">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pt-BR">
                                Português (Brasil)
                              </SelectItem>
                              <SelectItem value="en-US">
                                English (US)
                              </SelectItem>
                              <SelectItem value="es-ES">Español</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fuso">Fuso horário</Label>
                          <Select defaultValue="America/Sao_Paulo">
                            <SelectTrigger id="fuso">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="America/Sao_Paulo">
                                America/São_Paulo
                              </SelectItem>
                              <SelectItem value="UTC">UTC</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="telefone">Telefone (opcional)</Label>
                          <Input
                            id="telefone"
                            type="tel"
                            placeholder="(00) 00000-0000"
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">Senha</p>
                          <p className="text-sm text-muted-foreground">
                            Recomendado alterar periodicamente.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          className={cn(btnBase, btnOutline)}
                        >
                          Alterar senha
                        </Button>
                      </div>

                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">Excluir conta</p>
                          <p className="text-sm text-muted-foreground">
                            Não dá para desfazer esta ação.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          className={cn(btnBase, btnDanger)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {active === "privacidade" && (
                <motion.div {...motionProps} className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Privacidade & Segurança</CardTitle>
                      <CardDescription>
                        Controle quem vê suas informações e proteja sua conta.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Conta privada</p>
                          <p className="text-sm text-muted-foreground">
                            Apenas pessoas aprovadas veem seu conteúdo.
                          </p>
                        </div>
                        <Switch />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            Permitir mensagens de qualquer pessoa
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Deixe qualquer pessoa enviar DMs para você.
                          </p>
                        </div>
                        <Switch />
                      </div>

                      <Separator />

                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">
                            Autenticação de 2 fatores
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Adicione uma camada extra de segurança.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          className={cn(btnBase, btnOutline)}
                        >
                          Configurar 2FA
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {active === "notificacoes" && (
                <motion.div {...motionProps} className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Notificações</CardTitle>
                      <CardDescription>
                        Escolha como e quando quer ser notificado.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">E‑mail</p>
                          <p className="text-sm text-muted-foreground">
                            Receber atualizações por e‑mail.
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Push</p>
                          <p className="text-sm text-muted-foreground">
                            Notificações no dispositivo.
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Menções & respostas</p>
                          <p className="text-sm text-muted-foreground">
                            Seja notificado quando for mencionado.
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label>Resumo de e‑mail</Label>
                        <RadioGroup
                          defaultValue="semanal"
                          className="grid gap-2 sm:grid-cols-3"
                        >
                          <div className="flex items-center gap-2 rounded-md border p-3 hover:bg-muted/40 transition-colors">
                            <RadioGroupItem id="diario" value="diario" />
                            <Label htmlFor="diario" className="cursor-pointer">
                              Diário
                            </Label>
                          </div>
                          <div className="flex items-center gap-2 rounded-md border p-3 hover:bg-muted/40 transition-colors">
                            <RadioGroupItem id="semanal" value="semanal" />
                            <Label htmlFor="semanal" className="cursor-pointer">
                              Semanal
                            </Label>
                          </div>
                          <div className="flex items-center gap-2 rounded-md border p-3 hover:bg-muted/40 transition-colors">
                            <RadioGroupItem id="nunca" value="nunca" />
                            <Label htmlFor="nunca" className="cursor-pointer">
                              Nunca
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {active === "aparencia" && (
  <motion.div {...motionProps} className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Aparência</CardTitle>
        <CardDescription>
          Temas, acentos e tamanho de fonte.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tema */}
        <div className="space-y-3">
          <Label>Tema</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              type="button"
              // ativo => "default", inativo => "ghost"
              variant={theme === "system" ? "default" : "ghost"}
              className={cn(
                btnBase,
                theme !== "system" && btnOutline
              )}
              onClick={() => setTheme("system")}
            >
              <MonitorSmartphone className="h-4 w-4" />
              Sistema
            </Button>

            <Button
              type="button"
              variant={theme === "light" ? "default" : "ghost"}
              className={cn(
                btnBase,
                theme !== "light" && btnOutline
              )}
              onClick={() => setTheme("light")}
            >
              <Sun className="h-4 w-4" />
              Claro
            </Button>

            <Button
              type="button"
              variant={theme === "dark" ? "default" : "ghost"}
              className={cn(
                btnBase,
                theme !== "dark" && btnOutline
              )}
              onClick={() => setTheme("dark")}
            >
              <Moon className="h-4 w-4" />
              Escuro
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Sistema segue a preferência do SO; Claro/Escuro forçam o tema.
          </p>
        </div>

        {/* Cor de acento */}
        <div className="space-y-2">
          <Label htmlFor="accent">Cor de acento</Label>
          <Select value={accent} onValueChange={(v) => setAccent(v as any)}>
            <SelectTrigger id="accent">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Primária do app</SelectItem>
              <SelectItem value="blue">Azulado</SelectItem>
              <SelectItem value="violet">Violeta</SelectItem>
              <SelectItem value="green">Verde</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tamanho da fonte */}
        <div className="space-y-2">
          <Label>Tamanho da fonte</Label>
          <div className="px-1">
            <Slider
              value={[fontSize]}
              min={12}
              max={22}
              step={1}
              onValueChange={(vals) => setFontSize(vals[0])}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Pequena</span>
            <span>Grande</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)}

              {active === "acessibilidade" && (
                <motion.div {...motionProps} className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Acessibilidade</CardTitle>
                      <CardDescription>
                        Opções para melhorar legibilidade e navegação.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Contraste aumentado</p>
                          <p className="text-sm text-muted-foreground">
                            Melhora a visibilidade de elementos.
                          </p>
                        </div>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Animações reduzidas</p>
                          <p className="text-sm text-muted-foreground">
                            Minimiza efeitos visuais.
                          </p>
                        </div>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            Texto alternativo sugerido
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Sugerir alt‑text ao enviar imagens.
                          </p>
                        </div>
                        <Switch />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </section>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

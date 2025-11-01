// scripts/codemod-tailwind-tokens.mjs
import fs from "node:fs";
import path from "node:path";

const ROOTS = ["src", "app", "components", "pages"].filter((p) =>
  fs.existsSync(p),
); // ajuste conforme seu projeto
const EXTENSIONS = [".tsx", ".ts", ".jsx", ".js", ".html", ".css"];
const EXCLUDE_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".git",
  ".next",
  "out",
]);

const REPLACEMENTS = new Map(
  Object.entries({
    // ===== Substituições base (seguras na maioria dos casos) =====
    "bg-white": "bg-background",

    // Grays → tokens
    "bg-gray-50": "bg-muted",
    "bg-gray-100": "bg-muted",
    "text-gray-500": "text-muted-foreground",
    "text-gray-600": "text-muted-foreground",
    "text-gray-700": "text-foreground/80",
    "text-gray-800": "text-foreground/90",
    "border-gray-100": "border-border",
    "border-gray-200": "border-border",
    "ring-gray-200": "ring-ring",
    "ring-gray-300": "ring-ring",
    "hover:bg-gray-50": "hover:bg-accent",
    "hover:bg-gray-100": "hover:bg-accent",
    "hover:text-gray-700": "hover:text-accent-foreground",

    // Paletas similares (zinc/slate/stone/neutral) → tokens
    "bg-zinc-50": "bg-muted",
    "bg-slate-50": "bg-muted",
    "bg-stone-50": "bg-muted",
    "bg-neutral-50": "bg-muted",

    "text-zinc-500": "text-muted-foreground",
    "text-slate-500": "text-muted-foreground",
    "text-stone-500": "text-muted-foreground",
    "text-neutral-500": "text-muted-foreground",

    "text-zinc-600": "text-muted-foreground",
    "text-slate-600": "text-muted-foreground",
    "text-stone-600": "text-muted-foreground",
    "text-neutral-600": "text-muted-foreground",

    "text-zinc-700": "text-foreground/80",
    "text-slate-700": "text-foreground/80",
    "text-stone-700": "text-foreground/80",
    "text-neutral-700": "text-foreground/80",

    "text-zinc-800": "text-foreground/90",
    "text-slate-800": "text-foreground/90",
    "text-stone-800": "text-foreground/90",
    "text-neutral-800": "text-foreground/90",

    "border-zinc-200": "border-border",
    "border-slate-200": "border-border",
    "border-stone-200": "border-border",
    "border-neutral-200": "border-border",

    // ATENÇÃO: propositalmente NÃO mapeamos "text-white" e "bg-black"
    // pois dependem do contexto. Revise manualmente se aparecerem no seu projeto.
    // Exemplo comum: botões primários -> "bg-primary text-primary-foreground".
  }),
);

const DRY_RUN = !process.argv.includes("--write");
let changedFiles = 0;
let changedCount = 0;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (EXTENSIONS.includes(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

function replaceInContent(content) {
  let out = content;
  let localCount = 0;

  for (const [from, to] of REPLACEMENTS) {
    // bordas de palavra p/ evitar falso positivo dentro de outras classes
    const regex = new RegExp(`(?<![\\w-])${from}(?![\\w-])`, "g");
    out = out.replace(regex, (m) => {
      localCount++;
      return to;
    });
  }

  return { out, localCount };
}

function run() {
  if (ROOTS.length === 0) {
    console.log(
      "Nenhuma das pastas padrão foi encontrada (src, app, components, pages). Ajuste ROOTS no script.",
    );
    process.exit(1);
  }

  const files = ROOTS.flatMap((r) => walk(r));
  console.log(
    `Analisando ${files.length} arquivos... (modo ${DRY_RUN ? "dry-run" : "write"})`,
  );

  for (const f of files) {
    try {
      const content = fs.readFileSync(f, "utf8");
      const { out, localCount } = replaceInContent(content);
      if (localCount > 0) {
        changedFiles++;
        changedCount += localCount;
        console.log(
          `${DRY_RUN ? "[dry]" : "[write]"} ${f}  (+${localCount} substituições)`,
        );
        if (!DRY_RUN) fs.writeFileSync(f, out, "utf8");
      }
    } catch (e) {
      console.warn("Falha ao processar:", f, e.message);
    }
  }

  console.log(
    `${DRY_RUN ? "Possíveis" : "Aplicadas"} ${changedCount} substituições em ${changedFiles} arquivos.`,
  );
  if (DRY_RUN)
    console.log('Para aplicar as mudanças, rode novamente com "--write".');
}

run();

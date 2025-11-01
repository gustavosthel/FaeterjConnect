import * as React from "react";
import {
  initialsFromName,
  pastelGradientFromString,
  normalizeSeed,
} from "@/utils/avatarColor";

type UserAvatarProps = {
  name?: string; // exibido nas iniciais e title
  seed: string; // ✅ obrigatório: use userId SEMPRE
  src?: string | null; // URL da foto, quando houver
  size?: number; // px
  className?: string;
  title?: string;
};

export function UserAvatar({
  name,
  seed,
  src,
  size = 36,
  className = "",
  title,
}: UserAvatarProps) {
  // normaliza seed para evitar diferenças de maiúsculas/espacos
  const resolvedSeed = React.useMemo(() => normalizeSeed(seed), [seed]);
  const style = React.useMemo(
    () => pastelGradientFromString(resolvedSeed),
    [resolvedSeed],
  );
  const initials = React.useMemo(() => initialsFromName(name), [name]);

  // se a imagem falhar (404/erro CORS), cai no fallback
  const [useImage, setUseImage] = React.useState(!!src);
  React.useEffect(() => setUseImage(!!src), [src]);

  // acessibilidade
  const label = title || name || "Avatar";

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full ring-1 ring-border shadow-sm overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      title={label}
      aria-label={label}
    >
      {useImage && src ? (
        <img
          src={src}
          alt={name || "Avatar"}
          className="w-full h-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setUseImage(false)}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={style}
        >
          <span
            className="font-semibold text-white select-none"
            style={{ fontSize: Math.max(10, Math.round(size * 0.38)) }} // escala com o tamanho
          >
            {initials}
          </span>
        </div>
      )}
    </div>
  );
}

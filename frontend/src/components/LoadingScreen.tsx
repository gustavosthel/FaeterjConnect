import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen = ({
  message = "Carregando...",
}: LoadingScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px]">
      <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
};

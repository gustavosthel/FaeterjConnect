import { useState, useEffect } from "react";
import { Search, Mail } from "lucide-react";
import { usersApi, UserProfile } from "@/api/users";
import { chatApi, Conversation } from "@/api/chat";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { UserAvatar } from "@/components/UserAvatar";

interface UserSearchProps {
  onConversationStart: (conversation: Conversation) => void;
}

export const UserSearch = ({ onConversationStart }: UserSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await usersApi.list({ page: 0, size: 50 });
        const filteredResults = results.content.filter(
          (u) =>
            u.userId !== user?.userId &&
            (u.role === "ALUNO" || u.role === "PROFESSOR") &&
            (u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
              u.email.toLowerCase().includes(searchTerm.toLowerCase())),
        );
        setSearchResults(filteredResults);
      } catch (error) {
        toast.error("Erro ao buscar usuários");
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, user]);

  const handleStartConversation = async (otherUser: UserProfile) => {
    try {
      const conversation = await chatApi.createConversation(otherUser.userId);
      onConversationStart(conversation);
      setSearchTerm("");
      setSearchResults([]);
      toast.success(`Conversa iniciada com ${otherUser.username}`);
    } catch (error) {
      toast.error("Erro ao iniciar conversa");
    }
  };

  return (
    <div className="relative">
      {/* Barra de busca com glassmorphism */}
      <div
        className="
          flex items-center gap-3
          rounded-full px-4 py-3
          bg-background/60 dark:bg-neutral-900/40
          backdrop-blur-md border border-white/30 dark:border-white/10
          
          transition-all focus-within:ring-2 focus-within:ring-indigo-400/40
        "
      >
        <Search className="h-5 w-5 text-indigo-500" />
        <input
          type="text"
          placeholder="Buscar usuários por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="
            flex-1 bg-transparent outline-none
            text-sm placeholder:text-muted-foreground
          "
        />
      </div>

      {/* Dropdown de resultados */}
      {searchTerm && (
        <div
          className="
          z-[9999]
            absolute top-full left-0 right-0 mt-2
            rounded-xl overflow-hidden
            bg-background/80 dark:bg-neutral-900/80 backdrop-blur-md
            border border-white/30 dark:border-white/10
            shadow-lg max-h-64 overflow-y-auto
            animate-fadeIn
          "
        >
          {isSearching ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500 mx-auto mb-2" />
              Buscando usuários...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="divide-y divide-white/20 dark:divide-white/10">
              {searchResults.map((u) => (
                <button
                  key={u.userId}
                  onClick={() => handleStartConversation(u)}
                  className="
                    w-full flex items-center gap-3 p-3
                    hover:bg-indigo-50 dark:hover:bg-indigo-900/20
                    transition-colors
                  "
                >
                  <UserAvatar
                    name={u.username}
                    seed={u.userId} // ✅ SEMPRE o mesmo seed (userId)
                    src={null} // quando tiver foto
                    size={40}
                    className="ring-1 ring-neutral-200"
                  />

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{u.username}</p>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {u.email}
                    </p>
                  </div>
                  <span
                    className="
                      text-xs px-2 py-1 rounded-full
                      bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300
                      capitalize
                    "
                  >
                    {u.role.toLowerCase()}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              Nenhum usuário encontrado para "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

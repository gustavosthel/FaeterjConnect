import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import SockJS from "sockjs-client";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import { Sidebar } from "@/components/Sidebar"; // <- MANTIDO
import { UserSearch } from "@/components/UserSearch"; // <- AGORA INTEGRADO
import { toast } from "sonner";
import { chatApi, Conversation, Message, Participant } from "@/api/chat";
import { useAuthStore } from "@/store/useAuthStore";
import { UserAvatar } from "@/components/UserAvatar";
import {
  Dot,
  Wifi,
  WifiOff,
  MoreVertical,
  MessageSquareText,
  Paperclip,
  Smile,
  Send,
  Mic,
  CheckCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const WS_URL = import.meta.env.VITE_WS_URL ?? "http://localhost:8080/ws";

const normalize = (s?: string | null) => (s ?? "").trim().toLowerCase();
const uuid = () =>
  typeof crypto !== "undefined" && (crypto as any).randomUUID
    ? (crypto as any).randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function toISO(ts: any): string {
  if (ts === null || ts === undefined) return new Date().toISOString();
  if (typeof ts === "number")
    return new Date(ts < 1e12 ? ts * 1000 : ts).toISOString();
  if (typeof ts === "string") {
    const n = Number(ts);
    if (!Number.isNaN(n))
      return new Date(n < 1e12 ? n * 1000 : n).toISOString();
    let t = Date.parse(ts);
    if (!Number.isNaN(t)) return new Date(t).toISOString();
    const guess = ts.includes("T") ? ts : ts.replace(" ", "T");
    const withZ = /Z|[+-]\d{2}:?\d{2}$/.test(guess) ? guess : `${guess}Z`;
    t = Date.parse(withZ);
    return !Number.isNaN(t)
      ? new Date(t).toISOString()
      : new Date().toISOString();
  }
  try {
    return new Date(ts).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/** ---- Mini UI sem depender do seu <Button> ---- */
function CardShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-2xl border border-white/20 dark:border-white/10",
        "bg-background/60 dark:bg-neutral-900/50 backdrop-blur-xl",
        "shadow-[0_25px_80px_-35px_rgba(16,24,40,0.45)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function IconBtn(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return (
    <button
      className={[
        "h-9 w-9 rounded-full grid place-items-center",
        "bg-background/60 dark:bg-background/10 hover:bg-background/75 dark:hover:bg-background/15",
        "border border-white/40 dark:border-white/10",
        "text-muted-foreground backdrop-blur transition-all active:scale-[0.97]",
        className,
      ].join(" ")}
      {...rest}
    />
  );
}

function SendBtn(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return (
    <button
      className={[
        "h-11 w-11 rounded-full grid place-items-center",
        "bg-gradient-to-tr from-indigo-500 via-blue-500 to-sky-500 text-white",
        "shadow-[0_16px_40px_-14px_rgba(59,130,246,0.6)]",
        "hover:brightness-110 active:scale-[0.97] transition-all",
        className,
      ].join(" ")}
      {...rest}
    />
  );
}

/** ---- Página de Chat (mantendo <Sidebar /> + adicionando <UserSearch />) ---- */
export default function Chat() {
  // AUTH
  const { token, user, isAuthenticated } = useAuthStore();
  const myId = user?.userId ?? null;

  // STATE
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // typing
  const [typingBy, setTypingBy] = useState<Set<string>>(new Set());
  const typingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );

  // WS
  const stompClientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);
  const pendingMyTempIdsRef = useRef<
    Record<string, { content: string; at: number }>
  >({});

  // HELPERS
  const getParticipants = (conversationId: string) =>
    conversations.find((x) => x.id === conversationId)?.participants ?? [];

  const getOther = (c: Conversation): Participant | undefined =>
    c.participants.find((p) => p.userId !== myId);

  const displayName = (c: Conversation) =>
    c.isGroup ? (c.title ?? "Grupo") : (getOther(c)?.username ?? "Conversa");

  const typingHint = useMemo(() => {
    if (!selectedConversation) return "";
    const names = Array.from(typingBy)
      .map(
        (uid) =>
          getParticipants(selectedConversation.id).find((p) => p.userId === uid)
            ?.username ?? "Usuário",
      )
      .filter(Boolean);
    if (names.length === 0) return "";
    if (names.length === 1) return `${names[0]} está digitando…`;
    return `${names.slice(0, 2).join(", ")} ${names.length > 2 ? "e mais..." : ""} estão digitando…`;
  }, [typingBy, selectedConversation, conversations]);

  // EFFECTS
  useEffect(() => {
    loadConversations();
    return () => {
      try {
        subscriptionRef.current?.unsubscribe();
      } catch {}
      subscriptionRef.current = null;
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    connectWS();
    return () => {
      try {
        subscriptionRef.current?.unsubscribe();
      } catch {}
      subscriptionRef.current = null;
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
      setIsConnected(false);
    };
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!selectedConversation || !isConnected) return;
    const id = selectedConversation.id;

    // limpa typing
    setTypingBy(new Set());
    Object.values(typingTimersRef.current).forEach(clearTimeout);
    typingTimersRef.current = {};

    loadMessages(id);

    try {
      subscriptionRef.current?.unsubscribe();
    } catch {}
    subscriptionRef.current = null;

    subscribeToConversation(id);

    return () => {
      try {
        subscriptionRef.current?.unsubscribe();
      } catch {}
      subscriptionRef.current = null;
      Object.values(typingTimersRef.current).forEach(clearTimeout);
      typingTimersRef.current = {};
      setTypingBy(new Set());
    };
  }, [selectedConversation, isConnected]);

  // WS
  function connectWS() {
    if (stompClientRef.current?.connected) return;

    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
      stompClientRef.current = null;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      debug: () => {},
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    client.onConnect = () => {
      setIsConnected(true);
      toast.success("Chat conectado");
    };
    client.onStompError = () => {
      toast.error("Erro na conexão do chat");
      setIsConnected(false);
    };
    client.onWebSocketError = () => {
      toast.error("Erro WebSocket");
      setIsConnected(false);
    };
    client.onDisconnect = () => setIsConnected(false);

    client.activate();
    stompClientRef.current = client;
  }

  function mapToMessage(raw: any, conversationId: string): Message | null {
    const id = raw.id ?? uuid();
    const senderId = raw.senderId ?? raw.sender?.userId ?? "";
    const content = (raw.content ?? "").toString();
    const type = raw.type ?? "TEXT";
    const sentAt =
      raw.sentAt ?? raw.createdAt ?? raw.timestamp ?? raw.created_at;
    if (!content) return null;

    const participants = getParticipants(conversationId);
    const sender = participants.find(
      (p) => normalize(p.userId) === normalize(senderId),
    );
    return {
      id,
      conversationId: raw.conversationId ?? conversationId,
      senderId,
      senderUsername:
        sender?.username ??
        (normalize(senderId) === normalize(myId)
          ? (user?.username ?? "Você")
          : "Usuário"),
      content,
      timestamp: toISO(sentAt),
      type,
    };
  }

  function subscribeToConversation(conversationId: string) {
    if (!stompClientRef.current?.connected) return;
    subscriptionRef.current = stompClientRef.current.subscribe(
      `/topic/conversations/${conversationId}`,
      (message: IMessage) => {
        try {
          const data = JSON.parse(message.body);

          // Typing
          if ("typingUserId" in data && "conversationId" in data) {
            const typistId = String(data.typingUserId);
            if (normalize(typistId) !== normalize(myId)) {
              setTypingBy((prev) => new Set(prev).add(typistId));
              if (typingTimersRef.current[typistId])
                clearTimeout(typingTimersRef.current[typistId]);
              typingTimersRef.current[typistId] = setTimeout(() => {
                setTypingBy((prev) => {
                  const next = new Set(prev);
                  next.delete(typistId);
                  return next;
                });
                delete typingTimersRef.current[typistId];
              }, 2000);
            }
            return;
          }

          // Mensagem
          const mapped = mapToMessage(data, conversationId);
          if (!mapped) return;

          setMessages((prev) => {
            if (prev.some((m) => m.id === mapped.id)) return prev;

            const isMine = normalize(mapped.senderId) === normalize(myId);
            if (isMine) {
              for (const [tempId, meta] of Object.entries(
                pendingMyTempIdsRef.current,
              )) {
                if (
                  meta.content === mapped.content &&
                  Date.now() - meta.at < 10000 &&
                  prev.some((m) => m.id === tempId)
                ) {
                  const withoutTemp = prev.filter((m) => m.id !== tempId);
                  return [...withoutTemp, mapped];
                }
              }
            }

            // fallback por segurança
            for (const [tempId, meta] of Object.entries(
              pendingMyTempIdsRef.current,
            )) {
              if (
                meta.content === mapped.content &&
                Date.now() - meta.at < 10000 &&
                prev.some(
                  (m) =>
                    m.id === tempId &&
                    m.conversationId === mapped.conversationId,
                )
              ) {
                const withoutTemp = prev.filter((m) => m.id !== tempId);
                return [...withoutTemp, mapped];
              }
            }

            return [...prev, mapped];
          });

          setTypingBy((prev) => {
            const next = new Set(prev);
            next.delete(String(mapped.senderId));
            return next;
          });
        } catch (e) {
          console.error("WS parse error:", e, message.body);
        }
      },
    );
  }

  // API
  async function loadConversations() {
    try {
      const list = await chatApi.getConversations();
      setConversations(list);
      // Se desejar: selecionar a primeira ao abrir
      // if (!selectedConversation && list.length) setSelectedConversation(list[0]);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar conversas");
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(conversationId: string) {
    setMessagesLoading(true);
    try {
      const page = await chatApi.getMessages(conversationId, 0, 30);
      const participants = getParticipants(conversationId);

      const mapped: Message[] = (page.content ?? [])
        .map((raw: any) => {
          const id = raw.id ?? uuid();
          const senderId = raw.senderId ?? "";
          const sender = participants.find(
            (p) => normalize(p.userId) === normalize(senderId),
          );
          return {
            id,
            conversationId: raw.conversationId ?? conversationId,
            senderId,
            senderUsername:
              sender?.username ??
              (normalize(senderId) === normalize(myId)
                ? (user?.username ?? "Você")
                : "Usuário"),
            content: String(raw.content ?? ""),
            timestamp: toISO(
              raw.sentAt ?? raw.createdAt ?? raw.timestamp ?? raw.created_at,
            ),
            type: raw.type ?? "TEXT",
          };
        })
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );

      setMessages(mapped);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar mensagens");
    } finally {
      setMessagesLoading(false);
    }
  }

  function handleSendMessage(content: string) {
    const id = selectedConversation?.id;
    if (!stompClientRef.current?.connected || !selectedConversation || !id) {
      toast.error("Conexão não disponível. Tentando reconectar...");
      connectWS();
      return;
    }

    try {
      const meId = myId ?? "";
      const meName =
        selectedConversation.participants.find(
          (p) => normalize(p.userId) === normalize(meId),
        )?.username ??
        user?.username ??
        "Você";

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const optimistic: Message = {
        id: tempId,
        conversationId: id,
        senderId: meId,
        senderUsername: meName,
        content: content.trim(),
        timestamp: new Date().toISOString(),
        type: "TEXT",
      };
      if (!optimistic.content) return;

      pendingMyTempIdsRef.current[tempId] = {
        content: optimistic.content,
        at: Date.now(),
      };
      setMessages((prev) => [...prev, optimistic]);

      stompClientRef.current.publish({
        destination: "/app/chat.send",
        body: JSON.stringify({
          conversationId: id,
          content: optimistic.content,
          type: "TEXT",
        }),
      });
    } catch (e) {
      console.error(e);
      toast.error("Erro ao enviar mensagem");
    }
  }

  function sendTyping(id: string) {
    if (!stompClientRef.current?.connected) return;
    try {
      stompClientRef.current.publish({
        destination: "/app/chat.typing",
        headers: { conversationId: id },
        body: "{}",
      });
    } catch {}
  }

  // HANDLER p/ UserSearch -> abrir/selecionar conversa
  function handleOpenConversation(conv: Conversation) {
    if (!conversations.some((c) => c.id === conv.id)) {
      setConversations((prev) => [conv, ...prev]);
    }
    setSelectedConversation(conv);
    setMessages([]); // carrega via efeito
  }

  // RENDER
  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-slate-100 via-white to-indigo-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-slate-900">
      {/* 🔒 Mantido exatamente como antes */}
      <Sidebar />

      <main className="flex-1 ml-64 p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="h-[calc(100vh-3rem)]"
        >
          {/* HEADER DA PÁGINA */}
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white grid place-items-center shadow">
                <MessageSquareText className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-indigo-700">Mensagem</h1>
                <p className="text-xs text-muted-foreground">
                  Converse em tempo real
                </p>
              </div>
            </div>
          </div>

          {/* CONTEÚDO */}
          <div className="grid grid-cols-12 gap-6 h-[calc(100%-4rem)]">
            {/* LISTA DE CONVERSAS + USERSEARCH (INTEGRADO) */}
            <Card className="col-span-4 overflow-hidden flex flex-col">
              {/* Topo da coluna */}
              <div className="px-4 py-3 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
                <p className="text-sm font-medium">Conversas</p>
                <IconBtn aria-label="Mais">
                  <MoreVertical className="h-4 w-4" />
                </IconBtn>
              </div>

              {/* 🔎 Barra de busca Bonita (UserSearch) */}
              <div className="p-3 border-b border-white/20 dark:border-white/10">
                <UserSearch onConversationStart={handleOpenConversation} />
              </div>

              {/* Lista de conversas */}
              <div className="p-2 max-h-[calc(100vh-320px)] overflow-y-auto space-y-2">
                {conversations.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    Nenhuma conversa encontrada. Use a busca acima para iniciar
                    😉
                  </div>
                ) : (
                  conversations.map((c) => {
                    const selected = selectedConversation?.id === c.id;
                    const other = getOther(c);
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedConversation(c)}
                        className={[
                          "w-full text-left rounded-xl p-3 transition-all border group",
                          selected
                            ? "bg-gradient-to-tr from-indigo-500/15 to-blue-500/10 border-indigo-400/30"
                            : "bg-background/55 dark:bg-background/5 hover:bg-background/70 dark:hover:bg-background/10 border-white/40 dark:border-white/10",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            name={other.username}
                            seed={other.userId} // ✅ SEMPRE o mesmo seed (userId)
                            src={null} // quando tiver foto
                            size={40}
                            className="ring-1 ring-neutral-200"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">
                                {c.isGroup
                                  ? (c.title ?? "Grupo")
                                  : (other?.username ?? "Conversa")}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {c.isGroup
                                ? (c.title ?? "")
                                : (other?.email ?? "")}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </Card>

            {/* JANELA DO CHAT */}
            <Card className="col-span-8 flex flex-col overflow-hidden">
              {/* Header da conversa */}
              {selectedConversation ? (
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/20 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      name={getOther(selectedConversation)?.username}
                      seed={getOther(selectedConversation)?.userId} // ✅ SEMPRE o mesmo seed (userId)
                      src={null} // quando tiver foto
                      size={40}
                      className="ring-1 ring-neutral-200"
                    />
                    <div>
                      <h3 className="font-semibold leading-tight">
                        {displayName(selectedConversation)}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {getOther(selectedConversation)?.email ??
                            (selectedConversation.isGroup
                              ? selectedConversation.title
                              : "")}
                        </span>
                        {typingHint ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2 py-0.5">
                            <Dot className="h-4 w-4" /> {typingHint}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            {isConnected ? (
                              <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <WifiOff className="h-3.5 w-3.5 text-rose-500" />
                            )}
                            {isConnected ? "Online" : "Offline"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <IconBtn aria-label="Mais">
                    <MoreVertical className="h-4 w-4" />
                  </IconBtn>
                </div>
              ) : (
                <div className="grid place-items-center px-5 py-10 border-b border-white/20 dark:border-white/10">
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white grid place-items-center mx-auto mb-3 shadow-lg">
                      <MessageSquareText className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold">Bem-vindo ao Chat</h3>
                    <p className="text-sm text-muted-foreground">
                      Selecione uma conversa ou inicie uma nova pela barra de
                      busca.
                    </p>
                  </div>
                </div>
              )}

              {/* THREAD + COMPOSER */}
              {selectedConversation && (
                <ChatWindow
                  messages={messages}
                  loading={messagesLoading}
                  onSendMessage={(content) => handleSendMessage(content)}
                  conversationId={selectedConversation.id}
                  otherParticipant={getOther(selectedConversation)}
                  isConnected={isConnected}
                  onTyping={(id) => sendTyping(id)}
                />
              )}
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

/** ---- ChatWindow (visual novo, sem <Button>) ---- */
type ChatWindowProps = {
  messages: Message[];
  loading: boolean;
  onSendMessage: (content: string) => void;
  conversationId: string;
  otherParticipant?: Participant;
  isConnected: boolean;
  onTyping?: (conversationId: string) => void;
};

function ChatWindow({
  messages,
  loading,
  onSendMessage,
  conversationId,
  otherParticipant,
  isConnected,
  onTyping,
}: ChatWindowProps) {
  const { user } = useAuthStore();
  const myId = user?.userId ?? null;

  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const lastTypingAt = useRef(0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const emitTyping = () => {
    if (!isConnected || !onTyping) return;
    const now = Date.now();
    if (now - lastTypingAt.current > 2000) {
      lastTypingAt.current = now;
      onTyping(conversationId);
    }
  };

  const send = () => {
    const t = text.trim();
    if (!t || !isConnected) return;
    onSendMessage(t);
    setText("");
    setTimeout(
      () => endRef.current?.scrollIntoView({ behavior: "smooth" }),
      60,
    );
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "--:--";
      return d.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "--:--";
    }
  };

  const isMine = (senderId: string) => normalize(senderId) === normalize(myId);

  if (loading) {
    return (
      <div className="flex-1 grid place-items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-muted-foreground">Carregando mensagens…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* THREAD */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-transparent to-white/40 dark:to-white/5">
        {messages.length === 0 ? (
          <div className="h-full grid place-items-center">
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-indigo-600 text-white grid place-items-center mx-auto mb-4 shadow-lg">
                <MessageSquareText className="h-7 w-7" />
              </div>
              <p className="text-muted-foreground">Nenhuma mensagem ainda</p>
              <p className="text-sm text-muted-foreground">
                Envie uma mensagem para iniciar a conversa
              </p>
            </div>
          </div>
        ) : (
          messages.map((m, idx) => {
            const mine = isMine(m.senderId);
            const showName = !mine && !!m.senderUsername;
            const prev = messages[idx - 1];
            const showDateSeparator =
              !prev ||
              new Date(prev.timestamp).toDateString() !==
                new Date(m.timestamp).toDateString();

            return (
              <div key={m.id}>
                {showDateSeparator && (
                  <div className="my-3 flex items-center justify-center">
                    <span className="px-3 py-1 text-xs rounded-full bg-background/60 dark:bg-background/10 border border-white/30 dark:border-white/10 text-muted-foreground backdrop-blur">
                      {new Date(m.timestamp).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
                <div
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={[
                      "max-w-[78%] md:max-w-[65%] flex flex-col",
                      mine ? "items-end" : "items-start",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "px-4 py-2 rounded-2xl shadow-sm",
                        mine
                          ? "bg-indigo-600 text-white rounded-br-none"
                          : "bg-background/85 dark:bg-background/10 border border-white/40 dark:border-white/10 text-foreground rounded-bl-none backdrop-blur",
                      ].join(" ")}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {m.content}
                      </p>
                      <div
                        className={[
                          "flex items-center justify-end gap-1 mt-1",
                          mine ? "text-white/80" : "text-muted-foreground",
                        ].join(" ")}
                      >
                        <span className="text-[11px]">
                          {formatTime(m.timestamp)}
                        </span>
                        {mine && <CheckCheck className="h-3.5 w-3.5" />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* COMPOSER (sem <Button>) */}
      <div className="p-4 border-t border-white/20 dark:border-white/10 bg-background/50 dark:bg-background/5 backdrop-blur">
        {!isConnected && (
          <div className="mb-2 text-center text-xs text-rose-500">
            Você está offline. Reconecte para enviar mensagens.
          </div>
        )}

        <div className="flex items-end gap-2">
          <IconBtn aria-label="Anexar">
            <Paperclip className="h-4 w-4" />
          </IconBtn>

          <div className="flex-1 relative">
            <textarea
              rows={1}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                emitTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                } else {
                  emitTyping();
                }
              }}
              placeholder={
                isConnected
                  ? "Digite sua mensagem…"
                  : "Conecte para enviar mensagens"
              }
              className={[
                "w-full resize-none rounded-full pr-12 pl-4 py-3 text-sm",
                "bg-background/80 dark:bg-background/10 border border-white/50 dark:border-white/10",
                "placeholder:text-muted-foreground/70 outline-none",
                "backdrop-blur shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]",
                "focus:ring-2 focus:ring-indigo-400/40",
              ].join(" ")}
              disabled={!isConnected}
            />
            <IconBtn
              aria-label="Emoji"
              className="absolute right-1.5 top-1.5"
              onClick={() => {}}
              disabled={!isConnected}
            >
              <Smile className="h-4 w-4" />
            </IconBtn>
          </div>

          {text.trim() ? (
            <SendBtn aria-label="Enviar" onClick={send} disabled={!isConnected}>
              <Send className="h-4 w-4" />
            </SendBtn>
          ) : (
            <IconBtn
              aria-label="Gravar mensagem de voz"
              onClick={() => {}}
              disabled={!isConnected}
            >
              <Mic className="h-4 w-4" />
            </IconBtn>
          )}
        </div>
      </div>
    </div>
  );
}

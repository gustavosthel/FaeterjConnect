import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Wifi,
  WifiOff,
  Check,
  CheckCheck,
  Paperclip,
  Smile,
  Send,
  Mic,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { Message, Participant } from "@/api/chat";
import { UserAvatar } from "@/components/UserAvatar";

interface ChatWindowProps {
  messages: Message[];
  loading: boolean;
  onSendMessage: (content: string) => void;
  conversationId: string;
  otherParticipant?: Participant; // header p/ 1:1
  isConnected: boolean;
  onTyping?: (conversationId: string) => void; // (WS)
  typingHint?: string; // “Fulano está digitando…”
}

const normalize = (s?: string | null) => (s ?? "").trim().toLowerCase();

export function ChatWindow({
  messages,
  loading,
  onSendMessage,
  conversationId,
  otherParticipant,
  isConnected,
  onTyping,
  typingHint,
}: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastTypingAtRef = useRef<number>(0);
  const { user } = useAuthStore();
  const myId = user?.userId || null;

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function handleSend() {
    const text = newMessage.trim();
    if (!text || !isConnected) return;
    onSendMessage(text);
    setNewMessage("");
    setTimeout(scrollToBottom, 50);
  }

  function emitTyping() {
    if (!isConnected || !onTyping) return;
    const now = Date.now();
    if (now - lastTypingAtRef.current > 2000) {
      lastTypingAtRef.current = now;
      onTyping(conversationId);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      return;
    }
    emitTyping();
  }

  function formatTime(iso: string) {
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
  }

  function getMessageStatus(_: Message) {
    return "delivered"; // placeholder para evolução futura
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Carregando mensagens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header 1:1 + typing */}
      {otherParticipant && (
        <div className="border-b p-4 bg-background flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <UserAvatar
              name={otherParticipant.username}
              seed={otherParticipant.userId} // ✅ SEMPRE o mesmo seed (userId)
              src={null} // quando tiver foto
              size={40}
              className="ring-1 ring-neutral-200"
            />
            <div>
              <h3 className="font-semibold">{otherParticipant.username}</h3>
              <p className="text-xs text-muted-foreground">
                {otherParticipant.email}
              </p>
              {!!typingHint && (
                <p className="text-xs text-primary mt-1">{typingHint}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-xs text-muted-foreground">
              {isConnected ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      )}

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl mb-4">💬</div>
              <p className="text-muted-foreground">Nenhuma mensagem ainda</p>
              <p className="text-sm text-muted-foreground mt-2">
                Envie uma mensagem para iniciar a conversa
              </p>
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isMine = normalize(m.senderId) === normalize(myId);
            const status = getMessageStatus(m);
            return (
              <div
                key={m.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex flex-col max-w-xs lg:max-w-md ${isMine ? "items-end" : "items-start"}`}
                >
                  {/* Nome do remetente só nas mensagens dos outros */}
                  {!isMine && m.senderUsername && (
                    <p className="text-xs text-muted-foreground mb-1 ml-2">
                      {m.senderUsername}
                    </p>
                  )}
                  <div
                    className={`px-4 py-2 rounded-2xl ${isMine ? "bg-primary text-primary-foreground rounded-br-none" : "bg-background border rounded-bl-none"}`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {m.content}
                    </p>
                    <div
                      className={`flex items-center justify-end mt-1 space-x-1 ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                    >
                      <span className="text-xs">{formatTime(m.timestamp)}</span>
                      {isMine && (
                        <span className="text-xs">
                          {status === "sent" && <Check className="h-3 w-3" />}
                          {status === "delivered" && (
                            <CheckCheck className="h-3 w-3" />
                          )}
                          {status === "read" && (
                            <CheckCheck className="h-3 w-3 text-blue-400" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="border-t p-4 bg-background">
        {!isConnected && (
          <div className="text-center text-sm text-red-500 mb-2">
            Você está offline. Reconecte para enviar mensagens.
          </div>
        )}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            disabled={!isConnected}
            type="button"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                const now = Date.now();
                if (
                  isConnected &&
                  onTyping &&
                  now - lastTypingAtRef.current > 2000
                ) {
                  lastTypingAtRef.current = now;
                  onTyping(conversationId);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                isConnected
                  ? "Digite uma mensagem"
                  : "Conecte para enviar mensagens"
              }
              className="pr-12 rounded-full"
              disabled={!isConnected}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 text-muted-foreground"
              disabled={!isConnected}
              type="button"
              aria-label="Emojis"
            >
              <Smile className="h-5 w-5" />
            </Button>
          </div>

          {newMessage.trim() ? (
            <Button
              onClick={handleSend}
              size="icon"
              className="rounded-full"
              disabled={!isConnected}
              type="button"
              aria-label="Enviar"
            >
              <Send className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground rounded-full"
              disabled={!isConnected}
              type="button"
              aria-label="Gravar áudio"
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

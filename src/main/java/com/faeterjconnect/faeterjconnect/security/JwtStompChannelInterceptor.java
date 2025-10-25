package com.faeterjconnect.faeterjconnect.security;

import com.faeterjconnect.faeterjconnect.model.UserEntity;
import com.faeterjconnect.faeterjconnect.repository.ConversationRepository;
import com.faeterjconnect.faeterjconnect.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException; // ✅ use este
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.UUID;

@Component
public class JwtStompChannelInterceptor implements ChannelInterceptor {

    @Autowired TokenService tokenService;
    @Autowired UserService userService;
    @Autowired ConversationRepository conversationRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) return message;

        try {
            if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                handleConnect(accessor);
                System.out.println("[WS][CONNECT] user=" + accessor.getUser());
            } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                handleSubscribe(accessor);
                System.out.println("[WS][SUBSCRIBE] OK dest=" + accessor.getDestination());
            }
        } catch (Exception e) {
            System.err.println("[WS][ERR] cmd=" + accessor.getCommand()
                    + " dest=" + accessor.getDestination()
                    + " user=" + accessor.getUser()
                    + " cause=" + e.getClass().getSimpleName() + " - " + e.getMessage());
            throw e; // mantém encerrando a sessão (com ERROR frame para o cliente)
        }
        return message;
    }

    private void handleConnect(StompHeaderAccessor accessor) {
        // Token pode vir no header STOMP "Authorization" ou "token"
        String auth = accessor.getFirstNativeHeader("Authorization");
        if (auth == null) auth = accessor.getFirstNativeHeader("token");

        if (auth == null || (!auth.startsWith("Bearer ") && auth.length() < 10)) {
            throw new AccessDeniedException("Token ausente no CONNECT");
        }
        String token = auth.startsWith("Bearer ") ? auth.substring(7) : auth;

        String userEmail = tokenService.validateAndGetSubject(token); // retorna email ou lança
        UserEntity user = userService.findByEmail(userEmail)
                .orElseThrow(() -> new AccessDeniedException("Usuário inválido"));

        // Define Principal (com userId e email)
        accessor.setUser(new StompPrincipal(user.getUserId().toString(), user.getEmail()));
    }

    private void handleSubscribe(StompHeaderAccessor accessor) {
        Principal principal = accessor.getUser();
        if (principal == null) throw new AccessDeniedException("Não autenticado");

        // Extrai userId do nosso principal custom
        UUID userId = UUID.fromString(((StompPrincipal) principal).getUserId());

        String dest = accessor.getDestination();
        if (dest == null) throw new AccessDeniedException("Destino ausente");

        // Ex.: /topic/conversations/{id}
        if (dest.startsWith("/topic/conversations/")) {
            String idStr = dest.substring("/topic/conversations/".length()).trim();

            UUID conversationId;
            try {
                conversationId = UUID.fromString(idStr);
            } catch (IllegalArgumentException e) {
                throw new AccessDeniedException("Destino inválido: conversationId não é UUID");
            }

            // ✅ NÃO carrega a conversa nem acessa coleção LAZY:
            boolean allowed = conversationRepository.existsByIdAndParticipant(conversationId, userId);
            System.out.println("[WS][SUBSCRIBE] userId=" + userId + " convId=" + conversationId + " allowed=" + allowed);

            if (!allowed) {
                throw new AccessDeniedException("Você não participa desta conversa.");
            }
        }
    }

    public static class StompPrincipal implements Principal {
        private final String userId;
        private final String name;
        public StompPrincipal(String userId, String name) { this.userId = userId; this.name = name; }
        @Override public String getName() { return name; }
        public String getUserId() { return userId; }
    }
}

package com.faeterjconnect.faeterjconnect.controller;

import com.faeterjconnect.faeterjconnect.dto.MessageResponse;
import com.faeterjconnect.faeterjconnect.dto.SendMessageDTO;
import com.faeterjconnect.faeterjconnect.model.MessageEntity;
import com.faeterjconnect.faeterjconnect.security.JwtStompChannelInterceptor.StompPrincipal;
import com.faeterjconnect.faeterjconnect.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

@Controller
public class ChatWsController {

    @Autowired ChatService chatService;
    @Autowired SimpMessagingTemplate messagingTemplate;

    /** Cliente envia para /app/chat.send */
    @MessageMapping("/chat.send")
    public void send(@Valid @Payload SendMessageDTO dto, Principal principal) {
        UUID senderId = UUID.fromString(((StompPrincipal) principal).getUserId());

        MessageEntity saved = chatService.saveTextMessage(senderId, dto.conversationId(), dto.content(), dto.type());

        MessageResponse payload = ChatService.toResponse(saved);

        // Publica no tópico da conversa. Todos participantes inscritos recebem.
        String destination = "/topic/conversations/" + dto.conversationId();
        messagingTemplate.convertAndSend(destination, payload);
    }

    /** Evento "digitando..." -> /app/chat.typing -> /topic/conversations/{id} */
    @MessageMapping("/chat.typing")
    public void typing(@Header("conversationId") String conversationId, Principal principal) {
        UUID senderId = UUID.fromString(((StompPrincipal) principal).getUserId());
        var event = new TypingEvent(UUID.fromString(conversationId), senderId);
        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, event);
    }

    public record TypingEvent(UUID conversationId, UUID typingUserId) {}
}

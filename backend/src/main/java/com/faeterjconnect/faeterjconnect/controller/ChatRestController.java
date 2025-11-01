package com.faeterjconnect.faeterjconnect.controller;

import com.faeterjconnect.faeterjconnect.dto.MessageResponse;
import com.faeterjconnect.faeterjconnect.dto.ConversationResponse;
import com.faeterjconnect.faeterjconnect.model.ConversationEntity;
import com.faeterjconnect.faeterjconnect.model.UserEntity;
import com.faeterjconnect.faeterjconnect.service.ChatService;
import jakarta.validation.constraints.Min;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
public class ChatRestController {

    @Autowired
    private ChatService chatService;

    /**
     * Abre (ou retorna) uma conversa 1:1 entre o usuário logado e otherUserId.
     * POST /api/chat/conversations/{otherUserId}
     */
    @PostMapping("/conversations/{otherUserId}")
    public ResponseEntity<ConversationResponse> openConversation(
            @PathVariable UUID otherUserId,
            @AuthenticationPrincipal UserEntity user // <- pega o usuário logado direto do token
    ) {
        var conversation = chatService.findOrCreateOneToOne(user.getUserId(), otherUserId);
        return ResponseEntity.ok(toResponse(conversation));
    }

    /**
     * Lista as conversas do usuário logado.
     * GET /api/chat/conversations
     */
    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponse>> myConversations(
            @AuthenticationPrincipal UserEntity user
    ) {
        var list = chatService.listUserConversations(user.getUserId());
        return ResponseEntity.ok(list.stream().map(this::toResponse).toList());
    }

    /**
     * Retorna mensagens (paginadas) de uma conversa do usuário logado.
     * GET /api/chat/conversations/{conversationId}/messages?page=0&size=20
     */
    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<Page<MessageResponse>> getMessages(
            @PathVariable UUID conversationId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) int size,
            @AuthenticationPrincipal UserEntity user
    ) {
        Page<MessageResponse> msgs = chatService.getMessages(user.getUserId(), conversationId, page, size);
        return ResponseEntity.ok(msgs);
    }

    // ---- mapeador simples p/ DTO de conversa ----
    private ConversationResponse toResponse(ConversationEntity c) {
        var participants = c.getParticipants().stream()
                .map(u -> new ConversationResponse.ParticipantResponse(
                        u.getUserId(), u.getUsername(), u.getEmail()
                ))
                .toList();

        return new ConversationResponse(
                c.getIdConversation(), // se seu ConversationEntity usa getId(), troque aqui
                c.isGroup(),
                c.getTitle(),
                participants
        );
    }
}
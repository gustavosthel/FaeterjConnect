package com.faeterjconnect.faeterjconnect.dto;


import java.util.List;
import java.util.UUID;

public record ConversationResponse(
        UUID id,
        boolean isGroup,
        String title,
        List<ParticipantResponse> participants
) {
    public record ParticipantResponse(UUID userId, String username, String email) {}
}

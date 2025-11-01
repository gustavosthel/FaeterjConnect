package com.faeterjconnect.faeterjconnect.dto;


import com.faeterjconnect.faeterjconnect.model.enums.DeliveryStatusEnum;
import com.faeterjconnect.faeterjconnect.model.enums.MessageTypeEnum;

import java.time.Instant;
import java.util.UUID;

public record MessageResponse(
        UUID id,
        UUID conversationId,
        UUID senderId,
        String content,
        MessageTypeEnum type,
        String attachmentUrl,
        DeliveryStatusEnum status,
        Instant sentAt
) {}

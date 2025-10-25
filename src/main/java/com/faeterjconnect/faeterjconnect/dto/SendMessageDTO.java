package com.faeterjconnect.faeterjconnect.dto;

import com.faeterjconnect.faeterjconnect.model.MessageEntity;
import com.faeterjconnect.faeterjconnect.model.enums.MessageTypeEnum;
import jakarta.validation.constraints.*;
import java.util.UUID;

public record SendMessageDTO(
        @NotNull UUID conversationId,
        @NotBlank String content,
        MessageTypeEnum type
) {}

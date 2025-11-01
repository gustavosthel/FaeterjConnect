package com.faeterjconnect.faeterjconnect.dto;


import com.faeterjconnect.faeterjconnect.model.enums.RoleEnum;
import com.faeterjconnect.faeterjconnect.model.enums.RolePostEnum;
import com.faeterjconnect.faeterjconnect.model.enums.TurnoEnum;

import java.time.LocalDateTime;
import java.util.UUID;

public record CommentViewDTO(
        UUID commentId,
        UUID postId,
        UUID authorId,
        String authorUsername,
        String comment,
        LocalDateTime commentTime,
        RoleEnum rolePostEnum,
        TurnoEnum turnoEnum
) {}


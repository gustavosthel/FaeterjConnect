package com.faeterjconnect.faeterjconnect.dto;

import com.faeterjconnect.faeterjconnect.model.enums.RolePostEnum;

import java.time.LocalDateTime;
import java.util.UUID;

public record PostViewDTO(
        UUID postId,
        UUID authorId,
        String authorUsername,
        String content,
        RolePostEnum rolePostEnum,
        LocalDateTime createdAt,
        int commentsCount,
        long likeCount,
        boolean likedByMe

) {}




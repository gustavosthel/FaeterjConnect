package com.faeterjconnect.faeterjconnect.dto;


import java.time.LocalDateTime;
import java.util.UUID;

public record CommentViewDTO(
        UUID commentId,
        UUID postId,
        UUID authorId,
        String authorUsername,
        String comment,
        LocalDateTime commentTime
) {}


package com.faeterjconnect.faeterjconnect.dto;

import com.faeterjconnect.faeterjconnect.model.enums.RoleEnum;
import com.faeterjconnect.faeterjconnect.model.enums.RolePostEnum;
import com.faeterjconnect.faeterjconnect.model.enums.TurnoEnum;

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
        boolean likedByMe,
        // 👇 NOVOS CAMPOS (públicos) do autor
        RoleEnum authorRole,          // enum do usuário (ex.: ALUNO, PROFESSOR, ADMIN, ...)
        TurnoEnum authorTurnoEnum      // enum do turno (ex.: MANHA, TARDE, NOITE) ou null


) {}




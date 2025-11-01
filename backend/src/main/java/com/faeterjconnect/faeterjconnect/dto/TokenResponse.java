package com.faeterjconnect.faeterjconnect.dto;

import com.faeterjconnect.faeterjconnect.model.enums.RoleEnum;
import com.faeterjconnect.faeterjconnect.model.enums.TurnoEnum;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record TokenResponse(
        UUID userId,          // ✅ novo
        String username,
        String email,
        RoleEnum roleEnum,
        TurnoEnum turnoEnum,
        String token
) {}

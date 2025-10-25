package com.faeterjconnect.faeterjconnect.dto;

import com.faeterjconnect.faeterjconnect.model.enums.RoleEnum;
import com.faeterjconnect.faeterjconnect.model.enums.TurnoEnum;

import java.util.UUID;

public record UserViewDTO(
        UUID userId,
        String username,
        String email,
        RoleEnum role,
        TurnoEnum turnoEnum
) {}

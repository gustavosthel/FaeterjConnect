package com.faeterjconnect.faeterjconnect.dto;

import com.faeterjconnect.faeterjconnect.model.enums.TurnoEnum;

public record UpdateUserDTO(
        String username,
        String email,
        String password, // opcional; se null/blank, mantém a atual
        TurnoEnum turnoEnum
) {}

package com.faeterjconnect.faeterjconnect.dto;

import com.faeterjconnect.faeterjconnect.model.enums.RoleEnum;
import com.faeterjconnect.faeterjconnect.model.enums.TurnoEnum;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterDTO(@NotBlank @Size(min = 2, max = 20) String username,
                          @NotBlank @Email String email,
                          @NotBlank @Size(min = 6) String password,
                          RoleEnum roleEnum,
                          TurnoEnum turnoEnum) {
}

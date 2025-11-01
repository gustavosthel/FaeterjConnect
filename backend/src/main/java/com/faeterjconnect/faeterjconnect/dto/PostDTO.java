package com.faeterjconnect.faeterjconnect.dto;

import com.faeterjconnect.faeterjconnect.model.enums.RolePostEnum;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PostDTO(@NotBlank @Size(min = 3, max = 250) String content,
                      RolePostEnum rolePostEnum) {
}
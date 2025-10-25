package com.faeterjconnect.faeterjconnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommentedDTO(@NotBlank @Size(min = 3, max = 250) String commented) {
}

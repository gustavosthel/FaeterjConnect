package com.faeterjconnect.faeterjconnect.dto;

import com.faeterjconnect.faeterjconnect.model.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserDTO(@NotBlank @Size(min = 2, max = 20) String username,
                      @NotBlank @Email String email,
                      @NotBlank @Size(min = 6) String password,
                      Role role) {
}

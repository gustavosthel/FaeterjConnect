package com.faeterjconnect.faeterjconnect.controller;

import com.faeterjconnect.faeterjconnect.dto.*;
import com.faeterjconnect.faeterjconnect.model.UserEntity;
import com.faeterjconnect.faeterjconnect.model.enums.RoleEnum;
import com.faeterjconnect.faeterjconnect.security.TokenService;
import com.faeterjconnect.faeterjconnect.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userServices;
    @Autowired
    private TokenService tokenService;

    // --------- Auth ---------

    @PostMapping("/register")
    public ResponseEntity<TokenResponse> register(@RequestBody @Valid RegisterDTO registerDTO) {
        UserEntity newUser = userServices.register(registerDTO);
        String token = tokenService.generateToken(newUser);

        TokenResponse body = new TokenResponse(
                newUser.getUsername(),
                newUser.getEmail(),
                newUser.getRoleEnum(),
                newUser.getTurno(),
                token
        );
        return ResponseEntity.status(201).body(body);
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@RequestBody @Valid LoginDTO loginDTO) {
        UserEntity user = userServices.authenticate(loginDTO);
        String token = tokenService.generateToken(user);

        TokenResponse body = new TokenResponse(
                user.getUsername(),
                user.getEmail(),
                user.getRoleEnum(),
                user.getTurno(),
                token
        );
        return ResponseEntity.ok(body);
    }

    // --------- CRUD protegido (regras no service) ---------

    /**
     * Lista usuários (apenas ADMIN, regra no service).
     * Ex.: GET /api/user?page=0&size=10&role=ALUNO
     */
    @GetMapping
    public ResponseEntity<Page<UserViewDTO>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) RoleEnum role,
            // Se seu principal for CustomUserDetails:
            @AuthenticationPrincipal UserEntity user
            // Se você preferir diretamente a entidade:
            // @AuthenticationPrincipal(expression = "user") UserEntity currentUser
    ) {
        return ResponseEntity.ok(userServices.listUsers(user, page, size, role));
    }

    /**
     * Busca usuário: ADMIN ou o próprio (regra no service).
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserViewDTO> getById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserEntity user
    ) {
        return ResponseEntity.ok(userServices.getById(user, id));
    }

    /**
     * Atualiza: ADMIN ou o próprio (regra no service).
     * ADMIN pode alterar o papel via ?newRole=ADMIN|ALUNO
     */
    @PutMapping("/{id}")
    public ResponseEntity<UserViewDTO> update(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateUserDTO dto,
            @RequestParam(required = false) RoleEnum newRole,
            @AuthenticationPrincipal UserEntity user
    ) {
        var updated = userServices.updateUser(user, id, dto, newRole);
        return ResponseEntity.ok(updated);
    }

    /**
     * Deleta: ADMIN ou o próprio (regra no service).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserEntity user
    ) {
        userServices.deleteUser(user, id);
        return ResponseEntity.noContent().build();
    }
}
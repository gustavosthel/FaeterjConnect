package com.faeterjconnect.faeterjconnect.service;

import com.faeterjconnect.faeterjconnect.dto.LoginDTO;
import com.faeterjconnect.faeterjconnect.dto.RegisterDTO;
import com.faeterjconnect.faeterjconnect.dto.UpdateUserDTO;
import com.faeterjconnect.faeterjconnect.dto.UserViewDTO;
import com.faeterjconnect.faeterjconnect.exception.ExceptionCustom;
import com.faeterjconnect.faeterjconnect.model.UserEntity;
import com.faeterjconnect.faeterjconnect.model.enums.RoleEnum;
import com.faeterjconnect.faeterjconnect.model.enums.TurnoEnum;
import com.faeterjconnect.faeterjconnect.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    // --------- Regras de autenticação/registro ---------

    /** Registra usuário aplicando TODAS as validações de negócio. */
    public UserEntity register(RegisterDTO registerDTO) {
        if (!StringUtils.hasText(registerDTO.email()) || !StringUtils.hasText(registerDTO.password())) {
            throw new IllegalArgumentException("Email e senha são obrigatórios");
        }

        if (userRepository.existsByEmail(registerDTO.email())) {
            throw new ExceptionCustom.EmailAlreadyExistsException();
        }

        RoleEnum role = (registerDTO.roleEnum() != null) ? registerDTO.roleEnum() : RoleEnum.ALUNO;

        // Regra de negócio: só 1 ADMIN
        if (role == RoleEnum.ADMIN && userRepository.findByRoleEnum(RoleEnum.ADMIN).isPresent()) {
            throw new ExceptionCustom.AdminAlreadyExistsException();
        }

        UserEntity user = new UserEntity();
        user.setUsername(StringUtils.hasText(registerDTO.username()) ? registerDTO.username().trim() : registerDTO.email().trim());
        user.setEmail(registerDTO.email().trim());
        user.setRoleEnum(role);
        user.setPassword(passwordEncoder.encode(registerDTO.password()));
        user.setTurno(registerDTO.turnoEnum());
        user.setProfileImageUrl(null); // começa sem foto

        return userRepository.save(user);
    }

    /** Autentica as credenciais e retorna o usuário (ou lança BadCredentialsException). */
    public UserEntity authenticate(LoginDTO loginDTO) {
        var user = userRepository.findByEmail(loginDTO.email())
                .orElseThrow(ExceptionCustom.BadCredentialsException::new);

        if (!passwordEncoder.matches(loginDTO.password(), user.getPassword())) {
            throw new ExceptionCustom.BadCredentialsException();
        }
        return user;
    }

    // --------- Regras de autorização ---------

    public boolean isAdmin(UserEntity user) {
        return user != null && user.getRoleEnum() == RoleEnum.ADMIN;
    }

    private void ensureAuthenticated(UserEntity currentUser) {
        if (currentUser == null || currentUser.getUserId() == null) {
            throw new AccessDeniedException("Não autenticado");
        }
    }

    private void ensureAdmin(UserEntity currentUser) {
        ensureAuthenticated(currentUser);
        if (!isAdmin(currentUser)) {
            throw new AccessDeniedException("Acesso negado: requer ADMIN");
        }
    }

    private void ensureSelfOrAdmin(UserEntity currentUser, UUID targetUserId) {
        ensureAuthenticated(currentUser);
        if (!isAdmin(currentUser) && !currentUser.getUserId().equals(targetUserId)) {
            throw new AccessDeniedException("Acesso negado");
        }
    }

    // --------- Casos de uso (list/get/update/delete) ---------

    public Page<UserViewDTO> listUsers(UserEntity currentUser, int page, int size, RoleEnum roleFilter) {
        //ensureAdmin(currentUser);
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(size, 50), Sort.by("username").ascending());
        Page<UserEntity> pageResult = (roleFilter == null)
                ? userRepository.findAll(pageable)
                : userRepository.findAllByRoleEnum(roleFilter, pageable);
        return pageResult.map(this::toView);
    }

    public UserViewDTO getById(UserEntity currentUser, UUID userId) {
        //ensureSelfOrAdmin(currentUser, userId);
        UserEntity u = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
        return toView(u);
    }

    public UserViewDTO updateUser(UserEntity currentUser, UUID userId, UpdateUserDTO dto, RoleEnum newRoleIfAny) {
        ensureSelfOrAdmin(currentUser, userId);

        UserEntity u = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

        // username
        if (StringUtils.hasText(dto.username())) {
            u.setUsername(dto.username().trim());
        }

        // email (único)
        if (StringUtils.hasText(dto.email())) {
            String newEmail = dto.email().trim();
            if (!newEmail.equalsIgnoreCase(u.getEmail()) && userRepository.existsByEmail(newEmail)) {
                throw new ExceptionCustom.EmailAlreadyExistsException();
            }
            u.setEmail(newEmail);
        }

        // password
        if (StringUtils.hasText(dto.password())) {
            u.setPassword(passwordEncoder.encode(dto.password()));
        }

        // turno (opcional)
        TurnoEnum turno = dto.turnoEnum();
        if (turno != null) {
            u.setTurno(turno);
        }

        // role (somente ADMIN pode mudar role de alguém)
        if (newRoleIfAny != null) {
            if (!isAdmin(currentUser)) {
                throw new AccessDeniedException("Apenas ADMIN pode alterar papel");
            }
            if (newRoleIfAny == RoleEnum.ADMIN) {
                // Regra de negócio: manter no máximo 1 ADMIN
                var maybeAdmin = userRepository.findByRoleEnum(RoleEnum.ADMIN);
                if (maybeAdmin.isPresent() && !maybeAdmin.get().getUserId().equals(u.getUserId())) {
                    throw new ExceptionCustom.AdminAlreadyExistsException();
                }
            }
            u.setRoleEnum(newRoleIfAny);
        }

        return toView(userRepository.save(u));
    }

    public void deleteUser(UserEntity currentUser, UUID userId) {
        ensureSelfOrAdmin(currentUser, userId);
        if (!userRepository.existsById(userId)) {
            return; // idempotente
        }
        userRepository.deleteById(userId);
    }

    // --------- Queries utilitárias já usadas pelo controller legado ---------

    public Optional<UserEntity> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<UserEntity> findByType(RoleEnum type) {
        return userRepository.findByRoleEnum(type);
    }

    // --------- Mapper ---------

    private UserViewDTO toView(UserEntity u) {
        return new UserViewDTO(
                u.getUserId(),
                u.getUsername(),
                u.getEmail(),
                u.getRoleEnum(),
                u.getTurno()
                // se quiser retornar turno no DTO de visualização, adicione o campo no DTO
        );
    }
}
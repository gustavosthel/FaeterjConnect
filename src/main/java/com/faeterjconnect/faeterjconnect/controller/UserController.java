package com.faeterjconnect.faeterjconnect.controller;

import com.faeterjconnect.faeterjconnect.dto.UserDTO;
import com.faeterjconnect.faeterjconnect.exception.ExceptionCustom;
import com.faeterjconnect.faeterjconnect.model.UserEntity;
import com.faeterjconnect.faeterjconnect.model.enums.Role;
import com.faeterjconnect.faeterjconnect.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userServices;
//    @Autowired
//    private PasswordEncoder passwordEncoder;
//    @Autowired
//    private TokenService tokenService;

    @PostMapping("/register")
    public ResponseEntity register(@RequestBody @Valid UserDTO userDTO) throws Exception {

        if (userServices.findByEmail(userDTO.email()).isPresent()) {
            throw new ExceptionCustom.EmailAlreadyExistsException();
        }

        if (userDTO.role() == Role.ADMIN) {
            if (userServices.findByType(userDTO.role()).isEmpty()) {
                UserEntity newUser = userServices.createUser(userDTO);
                /*String token = tokenService.generateToken(newUser);*/
                return ResponseEntity.ok(newUser);
            }
            throw new ExceptionCustom.AdminAlreadyExistsException();
        }
        UserEntity newUser = userServices.createUser(userDTO);
        /*String token = tokenService.generateToken(newUser);*/
        return ResponseEntity.ok(newUser);
    }
}





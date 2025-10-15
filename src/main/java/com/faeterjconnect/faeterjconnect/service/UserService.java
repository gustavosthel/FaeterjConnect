package com.faeterjconnect.faeterjconnect.service;

import com.faeterjconnect.faeterjconnect.dto.UserDTO;
import com.faeterjconnect.faeterjconnect.model.UserEntity;
import com.faeterjconnect.faeterjconnect.model.enums.Role;
import com.faeterjconnect.faeterjconnect.repository.UserRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;
//    @Autowired
//    private PasswordEncoder passwordEncoder;

    public UserEntity createUser(UserDTO userDTO) throws Exception {

        UserEntity user = new UserEntity();
        user.setUsername(userDTO.username());
        user.setEmail(userDTO.email());
        user.setRole(userDTO.role());
        user.setPassword(/* passwordEncoder.encode( */ userDTO.password() /* ) */);


        saveUserDatabase(user);
        return user;
    }

//    public UserEntity createAdmin(UserDTO userDTO) {
//        UserEntity newUser = new UserEntity();
//        BeanUtils.copyProperties(userDTO, newUser);
//        newUser.setRole(userDTO.type());
//        newUser.setPassword(/*passwordEncoder.encode(*/newUser.getPassword()/*)*/);
//        saveUserDatabase(newUser);
//        return newUser;
//    }

    public void saveUserDatabase(UserEntity user) {
        this.userRepository.save(user);
    }

    public Optional<UserEntity> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<UserEntity> findByType(Role type) {return userRepository.findByRole(type);}
}




package com.faeterjconnect.faeterjconnect.model;

import com.faeterjconnect.faeterjconnect.model.enums.RoleEnum;
import com.faeterjconnect.faeterjconnect.model.enums.TurnoEnum;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "tb_user")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "user_id") // <— importante
    private UUID userId;
    private String username;
    private String email;
    private String password;
    @Enumerated(EnumType.STRING)
    private RoleEnum roleEnum;
//    // ✅ O lado inverso deve apontar para o atributo 'user' em PostLikeEntity
//    @OneToMany(mappedBy = "user", cascade = CascadeType.REMOVE, orphanRemoval = true)
//    @JsonIgnore // evita recursion em respostas JSON
//    private List<PostLikeEntity> likes = new ArrayList<>();
    @Enumerated(EnumType.STRING)
    @Column(name = "turno", length = 20)
    private TurnoEnum turno;


}



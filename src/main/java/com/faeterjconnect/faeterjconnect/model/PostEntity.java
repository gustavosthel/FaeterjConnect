package com.faeterjconnect.faeterjconnect.model;

import com.faeterjconnect.faeterjconnect.model.enums.RolePostEnum;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "tb_posts")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(of = "postId")
public class PostEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID postId;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"password", "role", "email",})
    private UserEntity user;

    private String content;

    @Enumerated(EnumType.STRING)
    private RolePostEnum rolePostEnum;

    @CreationTimestamp
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL)
    @JsonIgnoreProperties({"post"})
    private List<CommentedEntity> commented;
}
package com.faeterjconnect.faeterjconnect.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_comment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "commentId")
public class CommentedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID commentId;
    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"password", "role", "email",})
    private UserEntity user;
    private String comment;
    @ManyToOne
    @JoinColumn(name = "post_id")
    private PostEntity post;
    @CreationTimestamp
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime commentTime;
}
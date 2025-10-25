package com.faeterjconnect.faeterjconnect.model;

import com.faeterjconnect.faeterjconnect.model.UserEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "tb_conversation",
        indexes = {
                @Index(name="idx_conversation_is_group", columnList = "is_group")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "idConversation")
public class ConversationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id_conversation")
    private UUID idConversation;

    @Column(name="is_group", nullable = false)
    private boolean group;

    private String title; // opcional (útil em grupos)

    @ManyToMany
    @JoinTable(
            name = "tb_conversation_participants",
            joinColumns = @JoinColumn(
                    name = "conversation_id",              // FK nesta tabela de junção
                    referencedColumnName = "id_conversation" // PK de ConversationEntity
            ),
            inverseJoinColumns = @JoinColumn(
                    name = "user_id",                      // FK para usuário
                    referencedColumnName = "user_id"       // PK de UserEntity
            )
    )
    private Set<UserEntity> participants = new HashSet<>();

    @CreationTimestamp
    private Instant createdAt;

    // Conveniência para 1:1
    public boolean isOneToOne() {
        return !group && participants.size() == 2;
    }
}

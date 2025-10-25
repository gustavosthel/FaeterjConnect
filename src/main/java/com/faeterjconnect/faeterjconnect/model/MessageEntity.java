package com.faeterjconnect.faeterjconnect.model;

import com.faeterjconnect.faeterjconnect.model.enums.DeliveryStatusEnum;
import com.faeterjconnect.faeterjconnect.model.enums.MessageTypeEnum;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tb_message",
        indexes = {
                @Index(name="idx_message_conversation_time", columnList = "conversation_id, sentAt DESC")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class MessageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(
            name = "conversation_id",                // <- vamos padronizar para conversation_id
            referencedColumnName = "id_conversation",// <- PK física de ConversationEntity (veja observações)
            nullable = false
    )
    private ConversationEntity conversation;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(
            name = "sender_id",                      // <- opcional, mas bom padronizar
            referencedColumnName = "user_id",        // <- PK física de UserEntity (normalmente user_id)
            nullable = false
    )
    private UserEntity sender;

    @Enumerated(EnumType.STRING)
    private MessageTypeEnum type = MessageTypeEnum.TEXT;

    @Column(columnDefinition = "TEXT")
    private String content; // texto ou caption

    private String attachmentUrl; // se for arquivo/imagem

    @CreationTimestamp
    private Instant sentAt;

    @Enumerated(EnumType.STRING)
    private DeliveryStatusEnum status = DeliveryStatusEnum.SENT;
}

package com.faeterjconnect.faeterjconnect.service;

import com.faeterjconnect.faeterjconnect.dto.MessageResponse;
import com.faeterjconnect.faeterjconnect.model.ConversationEntity;
import com.faeterjconnect.faeterjconnect.model.MessageEntity;
import com.faeterjconnect.faeterjconnect.model.UserEntity;
import com.faeterjconnect.faeterjconnect.model.enums.DeliveryStatusEnum;
import com.faeterjconnect.faeterjconnect.model.enums.MessageTypeEnum;
import com.faeterjconnect.faeterjconnect.model.enums.RoleEnum;
import com.faeterjconnect.faeterjconnect.repository.ConversationRepository;
import com.faeterjconnect.faeterjconnect.repository.MessageRepository;
import com.faeterjconnect.faeterjconnect.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // <- use o Transactional do Spring

import java.util.List;
import java.util.UUID;

@Service
public class ChatService {

    @Autowired
    private ConversationRepository conversationRepository;
    @Autowired
    private MessageRepository messageRepository;
    @Autowired
    private UserRepository userRepository;

    @Transactional
    public ConversationEntity findOrCreateOneToOne(UUID requesterId, UUID otherId) {
        if (requesterId.equals(otherId)) {
            throw new IllegalArgumentException("Não é possível abrir conversa consigo mesmo.");
        }

        // Regra: somente aluno <-> professor (ajuste se quiser liberar geral)
        UserEntity u1 = userRepository.findById(requesterId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));
        UserEntity u2 = userRepository.findById(otherId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));

        boolean allowedPair =
                (u1.getRoleEnum() == RoleEnum.ALUNO && u2.getRoleEnum() == RoleEnum.PROFESSOR) ||
                        (u1.getRoleEnum() == RoleEnum.PROFESSOR && u2.getRoleEnum() == RoleEnum.ALUNO);

        if (!allowedPair) {
            throw new SecurityException("Somente aluno <-> professor podem iniciar conversa.");
        }

        return conversationRepository.findOneToOne(u1.getUserId(), u2.getUserId())
                .orElseGet(() -> {
                    ConversationEntity c = new ConversationEntity();
                    c.setGroup(false);
                    c.getParticipants().add(u1);
                    c.getParticipants().add(u2);
                    return conversationRepository.save(c);
                });
    }

    @Transactional(readOnly = true)
    public List<ConversationEntity> listUserConversations(UUID userId) {
        return conversationRepository.findAllByParticipant(userId);
    }

    @Transactional
    public MessageEntity saveTextMessage(UUID senderId, UUID conversationId, String content, MessageTypeEnum type) {
        ConversationEntity conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Conversa não encontrada."));
        UserEntity sender = userRepository.findById(senderId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));

        // valida participante
        boolean isParticipant = conv.getParticipants().stream()
                .anyMatch(u -> u.getUserId().equals(senderId));
        if (!isParticipant) {
            throw new SecurityException("Você não participa desta conversa.");
        }

        MessageEntity msg = new MessageEntity();
        msg.setConversation(conv);
        msg.setSender(sender);
        msg.setType(type == null ? MessageTypeEnum.TEXT : type);
        msg.setContent(content);
        msg.setStatus(DeliveryStatusEnum.SENT);

        return messageRepository.save(msg);
    }

    public static MessageResponse toResponse(MessageEntity m) {
        return new MessageResponse(
                m.getId(),
                // Se sua ConversationEntity usa getId() ao invés de getIdConversation(), ajuste aqui.
                m.getConversation().getIdConversation(),
                m.getSender().getUserId(),
                m.getContent(),
                m.getType(),
                m.getAttachmentUrl(),
                m.getStatus(),
                m.getSentAt()
        );
    }

    @Transactional(readOnly = true)
    public Page<MessageResponse> getMessages(UUID requesterId, UUID conversationId, int page, int size) {
        ConversationEntity conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Conversa não encontrada."));

        boolean isParticipant = conv.getParticipants().stream()
                .anyMatch(u -> u.getUserId().equals(requesterId));
        if (!isParticipant) {
            throw new SecurityException("Você não participa desta conversa.");
        }

        Page<MessageEntity> p = messageRepository.findByConversationOrderBySentAtDesc(
                conv, PageRequest.of(page, size));

        return p.map(ChatService::toResponse);
        // Alternativa com lambda, se preferir:
        // return p.map(this::toResponse); // se não for static
    }
}

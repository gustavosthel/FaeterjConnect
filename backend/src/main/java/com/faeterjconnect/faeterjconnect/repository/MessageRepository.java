package com.faeterjconnect.faeterjconnect.repository;

import com.faeterjconnect.faeterjconnect.model.ConversationEntity;
import com.faeterjconnect.faeterjconnect.model.MessageEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MessageRepository extends JpaRepository<MessageEntity, UUID> {
    Page<MessageEntity> findByConversationOrderBySentAtDesc(ConversationEntity conversation, Pageable pageable);
}

package com.faeterjconnect.faeterjconnect.repository;

import com.faeterjconnect.faeterjconnect.model.ConversationEntity;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.*;

public interface ConversationRepository extends JpaRepository<ConversationEntity, UUID> {

    @Query("""
        SELECT c FROM ConversationEntity c 
        JOIN c.participants p1 
        JOIN c.participants p2
        WHERE c.group = false AND p1.userId = :u1 AND p2.userId = :u2
    """)
    Optional<ConversationEntity> findOneToOne(@Param("u1") UUID u1, @Param("u2") UUID u2);

    @EntityGraph(attributePaths = {"participants"})
    @Query("""
        SELECT DISTINCT c FROM ConversationEntity c
        JOIN c.participants p
        WHERE p.userId = :userId
        ORDER BY c.idConversation DESC
    """)
    List<ConversationEntity> findAllByParticipant(@Param("userId") UUID userId);

    // ✅ NOVO: checagem sem carregar coleção (evita LazyInitializationException)
    @Query("""
        SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END
        FROM ConversationEntity c
        JOIN c.participants p
        WHERE c.idConversation = :conversationId AND p.userId = :userId
    """)
    boolean existsByIdAndParticipant(@Param("conversationId") UUID conversationId,
                                     @Param("userId") UUID userId);

    // Optional<ConversationEntity> findById(UUID id); // <- já existe no JpaRepository; não precisa redeclarar
}
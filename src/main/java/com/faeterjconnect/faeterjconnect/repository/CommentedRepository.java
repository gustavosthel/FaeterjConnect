package com.faeterjconnect.faeterjconnect.repository;

import com.faeterjconnect.faeterjconnect.model.CommentedEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CommentedRepository extends JpaRepository<CommentedEntity, UUID> {


    @EntityGraph(attributePaths = {"user", "post"})
    Page<CommentedEntity> findByPost_PostId(UUID postId, Pageable pageable);

    long countByPost_PostId(UUID postId);

}

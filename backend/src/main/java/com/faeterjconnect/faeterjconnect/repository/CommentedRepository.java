package com.faeterjconnect.faeterjconnect.repository;

import com.faeterjconnect.faeterjconnect.model.CommentedEntity;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface CommentedRepository extends JpaRepository<CommentedEntity, UUID> {


    @EntityGraph(attributePaths = {"user", "post"})
    Page<CommentedEntity> findByPost_PostId(UUID postId, Pageable pageable);

    @Query("""
        select c
        from CommentedEntity c
        where c.post.postId = :postId
        order by
          case when c.commentTime is null then 1 else 0 end,   
          c.commentTime desc,                                   
          c.commentId desc                                     
    """)
    Page<CommentedEntity> findNewestFirst(@Param("postId") UUID postId, Pageable pageable);


}

package com.faeterjconnect.faeterjconnect.repository;


import com.faeterjconnect.faeterjconnect.model.PostEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;


@Repository
public interface PostRepository extends JpaRepository<PostEntity, UUID> {

    /**
     * Primeira “página” do feed (sem cursor): ordena por createdAt DESC, postId DESC e limita por Pageable.
     */
    @EntityGraph(attributePaths = {"user"})
    @Query("""
            select p
            from PostEntity p
            order by p.createdAt desc, p.postId desc
           """)
    List<PostEntity> findFirstPage(Pageable pageable);

    /**
     * Próximo “slice” usando keyset: (createdAt, postId) < (cursorCreatedAt, cursorPostId).
     * Usa a mesma ordenação e limite por Pageable.
     */
    @EntityGraph(attributePaths = {"user"})
    @Query("""
            select p
            from PostEntity p
            where (p.createdAt < :createdAt)
               or (p.createdAt = :createdAt and p.postId < :postId)
            order by p.createdAt desc, p.postId desc
           """)
    List<PostEntity> findSlice(LocalDateTime createdAt, UUID postId, Pageable pageable);


    @Query("""
        SELECT p
        FROM PostEntity p
        WHERE p.user.userId = :authorId
        ORDER BY p.createdAt DESC, p.postId DESC
    """)
    List<PostEntity> findFirstPageByAuthor(@Param("authorId") UUID authorId,
                                           Pageable pageable);

    @Query("""
        SELECT p
        FROM PostEntity p
        WHERE p.user.userId = :authorId
          AND (
            p.createdAt < :createdAt
            OR (p.createdAt = :createdAt AND p.postId < :postId)
          )
        ORDER BY p.createdAt DESC, p.postId DESC
    """)
    List<PostEntity> findSliceByAuthor(@Param("authorId") UUID authorId,
                                       @Param("createdAt") LocalDateTime createdAt,
                                       @Param("postId") UUID postId,
                                       Pageable pageable);

}


package com.faeterjconnect.faeterjconnect.repository;

import com.faeterjconnect.faeterjconnect.model.PostLikeEntity;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.*;

public interface PostLikeRepository extends JpaRepository<PostLikeEntity, UUID> {

    boolean existsByPost_PostIdAndUser_UserId(UUID postId, UUID userId);

    long countByPost_PostId(UUID postId);

    void deleteByPost_PostIdAndUser_UserId(UUID postId, UUID userId);

    @Query("""
           select pl.post.postId as postId, count(pl) as cnt
           from PostLikeEntity pl
           where pl.post.postId in :postIds
           group by pl.post.postId
           """)
    List<LikeCountProjection> countByPostIds(Collection<UUID> postIds);

    @Query("""
           select pl.post.postId
           from PostLikeEntity pl
           where pl.user.userId = :userId and pl.post.postId in :postIds
           """)
    Set<UUID> findPostIdsLikedByUser(UUID userId, Collection<UUID> postIds);


    long deleteByPost_PostId(UUID postId);


    interface LikeCountProjection {
        UUID getPostId();
        long getCnt();
    }
}
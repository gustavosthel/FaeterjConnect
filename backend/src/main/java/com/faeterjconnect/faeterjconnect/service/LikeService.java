package com.faeterjconnect.faeterjconnect.service;

import com.faeterjconnect.faeterjconnect.exception.ExceptionCustom;
import com.faeterjconnect.faeterjconnect.model.PostEntity;
import com.faeterjconnect.faeterjconnect.model.PostLikeEntity;
import com.faeterjconnect.faeterjconnect.model.UserEntity;
import com.faeterjconnect.faeterjconnect.repository.PostLikeRepository;
import com.faeterjconnect.faeterjconnect.repository.PostRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class LikeService {

    @Autowired
    private PostRepository postRepository;
    @Autowired
    private PostLikeRepository postLikeRepository;

    @Transactional
    public LikeView likePost(UUID postId, UserEntity user) {
        validateUser(user);

        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new ExceptionCustom.PostNotExistsException());

        // Evita duplicata; ainda assim manter UNIQUE no banco
        if (!postLikeRepository.existsByPost_PostIdAndUser_UserId(postId, user.getUserId())) {
            try {
                PostLikeEntity like = new PostLikeEntity();
                like.setPost(post);
                like.setUser(user);
                postLikeRepository.save(like);
            } catch (DataIntegrityViolationException e) {
                // Race condition: já foi curtido em paralelo – ignora
            }
        }

        long likeCount = postLikeRepository.countByPost_PostId(postId);
        return new LikeView(postId, likeCount, true);
    }

    @Transactional
    public LikeView unlikePost(UUID postId, UserEntity user) {
        validateUser(user);

        // Idempotente: remove se existir
        postLikeRepository.deleteByPost_PostIdAndUser_UserId(postId, user.getUserId());

        long likeCount = postLikeRepository.countByPost_PostId(postId);
        boolean likedByMe = false;
        return new LikeView(postId, likeCount, likedByMe);
    }

    private void validateUser(UserEntity user) {
        if (user == null || user.getUserId() == null) {
            throw new ExceptionCustom.InvalidUserException();
        }
    }

    public record LikeView(UUID postId, long likeCount, boolean likedByMe) {}
}

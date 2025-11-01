package com.faeterjconnect.faeterjconnect.service;

import com.faeterjconnect.faeterjconnect.dto.CommentViewDTO;
import com.faeterjconnect.faeterjconnect.dto.CommentedDTO;
import com.faeterjconnect.faeterjconnect.dto.PageResponse;
import com.faeterjconnect.faeterjconnect.exception.ExceptionCustom;
import com.faeterjconnect.faeterjconnect.model.CommentedEntity;
import com.faeterjconnect.faeterjconnect.model.PostEntity;
import com.faeterjconnect.faeterjconnect.model.UserEntity;
import com.faeterjconnect.faeterjconnect.model.enums.RoleEnum;
import com.faeterjconnect.faeterjconnect.repository.CommentedRepository;
import com.faeterjconnect.faeterjconnect.repository.PostRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class CommentedService {

    @Autowired
    private CommentedRepository commentedRepository;
    @Autowired
    private PostRepository postRepository;

    @Transactional
    public CommentViewDTO createCommented(UUID postId, CommentedDTO comment, UserEntity user) {

        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new ExceptionCustom.PostNotExistsException());

        String text = comment.comment();
        CommentedEntity commented = new CommentedEntity();
        commented.setPost(post);
        commented.setUser(user);
        commented.setComment(text);
        // commentTime: @CreationTimestamp cuida

        CommentedEntity saved = commentedRepository.save(commented);
        // manter consistência in-memory (opcional)
        if (post.getCommented() != null) {
            post.getCommented().add(saved);
        }

        return toViewDTO(saved);
    }

    public void deleteComment(UUID commentId, UserEntity user) {
        CommentedEntity comment = commentedRepository.findById(commentId)
                .orElseThrow(() -> new ExceptionCustom.CommentNotExistsException());

        boolean isOwner = comment.getUser() != null
                && user != null
                && comment.getUser().getUserId().equals(user.getUserId());

        boolean isAdmin = user != null
                && user.getRoleEnum() != null
                && user.getRoleEnum() == RoleEnum.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new ExceptionCustom.CommentNotYoursException();
        }

        commentedRepository.delete(comment);
    }

    public PageResponse<CommentViewDTO> listComments(UUID postId, int page, int size) {
        if (size <= 0) size = 10;
        if (page < 0) page = 0;

        Pageable pageable = PageRequest.of(page, size); // sem Sort aqui

        Page<CommentedEntity> cPage = commentedRepository.findNewestFirst(postId, pageable);

        List<CommentViewDTO> items = cPage.getContent()
                .stream()
                .map(this::toViewDTO)
                .toList();

        return new PageResponse<>(
                items,
                cPage.getNumber(),
                cPage.getSize(),
                cPage.getTotalElements(),
                cPage.getTotalPages(),
                cPage.hasNext(),
                cPage.hasPrevious()
        );
    }

    private CommentViewDTO toViewDTO(CommentedEntity c) {
        return new CommentViewDTO(
                c.getCommentId(),
                c.getPost() != null ? c.getPost().getPostId() : null,
                c.getUser() != null ? c.getUser().getUserId() : null,
                c.getUser() != null ? c.getUser().getUsername() : null,
                c.getComment(),
                c.getCommentTime(),
                c.getUser().getRoleEnum(),
                c.getUser().getTurno()
        );
    }


}

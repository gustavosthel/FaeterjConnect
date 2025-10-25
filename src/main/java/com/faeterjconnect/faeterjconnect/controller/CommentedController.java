package com.faeterjconnect.faeterjconnect.controller;

import com.faeterjconnect.faeterjconnect.dto.CommentViewDTO;
import com.faeterjconnect.faeterjconnect.dto.CommentedDTO;
import com.faeterjconnect.faeterjconnect.dto.PageResponse;
import com.faeterjconnect.faeterjconnect.model.UserEntity;
import com.faeterjconnect.faeterjconnect.service.CommentedService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/comments")
public class CommentedController {

    @Autowired
    private CommentedService commentedService;

    /**
     * Cria um comentário em um post.
     * POST /api/comments/{postId}
     */
    @PostMapping("/create/{postId}")
    public ResponseEntity<CommentViewDTO> create(
            @PathVariable UUID postId,
            @RequestBody @Valid CommentedDTO commentedDTO,
            @AuthenticationPrincipal UserEntity user
    ) {
        CommentViewDTO created = commentedService.createCommented(postId, commentedDTO, user);
        return ResponseEntity.status(201).body(created);
    }

    /**
     * Lista comentários de um post (paginação por página).
     * GET /api/comments/{postId}?page=0&size=10
     */
    @GetMapping("/{postId}")
    public ResponseEntity<PageResponse<CommentViewDTO>> list(
            @PathVariable UUID postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(commentedService.listComments(postId, page, size));
    }

    /**
     * Exclui um comentário (somente autor ou ADMIN).
     * DELETE /api/comments/{commentId}
     */
    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID commentId,
            @AuthenticationPrincipal UserEntity user
    ) {
        commentedService.deleteComment(commentId, user);
        return ResponseEntity.noContent().build();
    }

}

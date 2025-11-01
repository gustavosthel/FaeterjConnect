package com.faeterjconnect.faeterjconnect.controller;


import com.faeterjconnect.faeterjconnect.dto.CursorPage;
import com.faeterjconnect.faeterjconnect.dto.PostDTO;
import com.faeterjconnect.faeterjconnect.dto.PostViewDTO;
import com.faeterjconnect.faeterjconnect.model.UserEntity;
import com.faeterjconnect.faeterjconnect.service.LikeService;
import com.faeterjconnect.faeterjconnect.service.PostService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    @Autowired
    private PostService postService;
    @Autowired
    private LikeService likeService;


    @PostMapping("/create")
    public PostViewDTO create(@RequestBody @Valid PostDTO dto,
                              @AuthenticationPrincipal UserEntity user) {
        return postService.createPost(dto, user);
    }

    @DeleteMapping("/delete/{postId}")
    public void delete(@PathVariable UUID postId,
                       @AuthenticationPrincipal UserEntity user) {
        postService.deletePost(postId, user);
    }

    @GetMapping
    public CursorPage<PostViewDTO> feed(
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String cursor,
            @RequestParam(required = false) UUID authorId,
            @AuthenticationPrincipal UserEntity user
    ) {
        if (authorId != null) {
            // ✅ Lista posts de UM usuário específico (perfil)
            return postService.getPostsByAuthorCursor(limit, cursor, authorId, user);
        }
        // ✅ Feed geral (como já existia)
        return postService.getFeedByCursor(limit, cursor, user);
    }



    @PostMapping("/{postId}/likes")
    public LikeService.LikeView like(@PathVariable UUID postId,
                                     @AuthenticationPrincipal UserEntity user) {
        return likeService.likePost(postId, user);
    }

    @DeleteMapping("/{postId}/likes")
    public LikeService.LikeView unlike(@PathVariable UUID postId,
                                       @AuthenticationPrincipal UserEntity user) {
        return likeService.unlikePost(postId, user);
    }
}

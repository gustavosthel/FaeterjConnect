package com.faeterjconnect.faeterjconnect.service;

import com.faeterjconnect.faeterjconnect.dto.CursorPage;
import com.faeterjconnect.faeterjconnect.dto.PostDTO;
import com.faeterjconnect.faeterjconnect.dto.PostViewDTO;
import com.faeterjconnect.faeterjconnect.exception.ExceptionCustom;
import com.faeterjconnect.faeterjconnect.model.PostEntity;
import com.faeterjconnect.faeterjconnect.model.UserEntity;
import com.faeterjconnect.faeterjconnect.model.enums.RoleEnum;
import com.faeterjconnect.faeterjconnect.repository.PostLikeRepository;
import com.faeterjconnect.faeterjconnect.repository.PostRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PostService {

    @Autowired
    private PostRepository postRepository;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private PostLikeRepository postLikeRepository;

    private static final int DEFAULT_LIMIT = 10;
    private static final int MAX_LIMIT = 50;

    public PostViewDTO createPost(PostDTO postDTO, UserEntity user) {
        if (user == null || user.getUserId() == null) {
            throw new ExceptionCustom.InvalidUserException();
        }

        if (postDTO.rolePostEnum() == null) {
            throw new ExceptionCustom.InvalidRoleException();
        }

        PostEntity post = new PostEntity();
        post.setUser(user);
        post.setContent(postDTO.content());
        post.setRolePostEnum(postDTO.rolePostEnum());

        PostEntity postSaved = postRepository.save(post);

        // Novo post nasce com 0 likes e não curtido pelo autor (ou cliente atual)
        return toViewDTO(postSaved, 0L, false);
    }

    public void deletePost(UUID postId, UserEntity user) {
        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new ExceptionCustom.PostNotExistsException());

        boolean isOwner = post.getUser() != null
                && user != null
                && post.getUser().getUserId().equals(user.getUserId());

        boolean isAdmin = user != null
                && user.getRoleEnum() != null
                && user.getRoleEnum() == RoleEnum.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new ExceptionCustom.PostNotExistsException();
        }

        postRepository.delete(post);
    }

    // ---------- FEED POR CURSOR ----------

    @Transactional(readOnly = true)
    public CursorPage<PostViewDTO> getFeedByCursor(Integer limitParam, String cursor, UserEntity user) {
        int limit = normalizeLimit(limitParam);

        var sort = Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("postId"));
        var pageRequest = PageRequest.of(0, limit, sort);

        List<PostEntity> posts;
        if (cursor == null || cursor.isBlank()) {
            posts = postRepository.findFirstPage(pageRequest);
        } else {
            var decoded = decodeCursor(cursor);
            posts = (decoded == null)
                    ? postRepository.findFirstPage(pageRequest)
                    : postRepository.findSlice(decoded.createdAt(), decoded.postId(), pageRequest);
        }

        // Se não há posts, retorna vazio sem consultar likes
        if (posts.isEmpty()) {
            return new CursorPage<>(List.of(), null);
        }

        // === Contagem e likedByMe em lote (evita N+1) ===
        var postIds = posts.stream().map(PostEntity::getPostId).toList();

        Map<UUID, Long> likeCountMap = postIds.isEmpty()
                ? Collections.emptyMap()
                : postLikeRepository.countByPostIds(postIds).stream()
                .collect(Collectors.toMap(
                        PostLikeRepository.LikeCountProjection::getPostId,
                        PostLikeRepository.LikeCountProjection::getCnt
                ));

        Set<UUID> likedByMeSet = (user != null && user.getUserId() != null && !postIds.isEmpty())
                ? postLikeRepository.findPostIdsLikedByUser(user.getUserId(), postIds)
                : Collections.emptySet();

        List<PostViewDTO> items = posts.stream()
                .map(p -> toViewDTO(
                        p,
                        likeCountMap.getOrDefault(p.getPostId(), 0L),
                        likedByMeSet.contains(p.getPostId())
                ))
                .toList();

        String nextCursor = null;
        if (posts.size() == limit) {
            PostEntity last = posts.get(posts.size() - 1);
            nextCursor = encodeCursor(last.getCreatedAt(), last.getPostId());
        }

        return new CursorPage<>(items, nextCursor);
    }

    // ---------- Helpers ----------

    private int normalizeLimit(Integer limitParam) {
        int limit = (limitParam == null) ? DEFAULT_LIMIT : limitParam;
        if (limit <= 0) limit = DEFAULT_LIMIT;
        if (limit > MAX_LIMIT) limit = MAX_LIMIT;
        return limit;
    }

    private PostViewDTO toViewDTO(PostEntity p, long likeCount, boolean likedByMe) {
        return new PostViewDTO(
                p.getPostId(),
                (p.getUser() != null) ? p.getUser().getUserId() : null,
                (p.getUser() != null) ? p.getUser().getUsername() : null,
                p.getContent(),
                p.getRolePostEnum(),
                p.getCreatedAt(),
                (p.getCommented() != null) ? p.getCommented().size() : 0,
                likeCount,
                likedByMe
        );
    }

    private String encodeCursor(LocalDateTime createdAt, UUID postId) {
        try {
            Map<String, String> payload = Map.of(
                    "createdAt", (createdAt != null ? createdAt.toString() : ""),
                    "postId", (postId != null ? postId.toString() : "")
            );
            byte[] json = objectMapper.writeValueAsBytes(payload);
            return Base64.getUrlEncoder().withoutPadding().encodeToString(json);
        } catch (Exception e) {
            return null;
        }
    }

    private Cursor decodeCursor(String cursor) {
        try {
            byte[] json = Base64.getUrlDecoder().decode(cursor.getBytes(StandardCharsets.UTF_8));
            Map<String, String> payload = objectMapper.readValue(json, new TypeReference<Map<String, String>>() {});
            LocalDateTime createdAt = LocalDateTime.parse(payload.get("createdAt"));
            UUID postId = UUID.fromString(payload.get("postId"));
            return new Cursor(createdAt, postId);
        } catch (Exception e) {
            // Cursor inválido/expirado/formato errado → retorna null
            return null;
        }
    }

    private record Cursor(LocalDateTime createdAt, UUID postId) { }
}

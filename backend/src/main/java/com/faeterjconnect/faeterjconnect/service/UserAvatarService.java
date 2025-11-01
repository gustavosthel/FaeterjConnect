package com.faeterjconnect.faeterjconnect.service;


import com.faeterjconnect.faeterjconnect.model.UserEntity;
import com.faeterjconnect.faeterjconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserAvatarService {

    private final UserRepository userRepository;

    @Value("${app.media.local-path}")
    private String mediaLocalPath;

    @Value("${app.media.base-url}")
    private String mediaBaseUrl;

    private static final Set<String> ALLOWED = Set.of("image/jpeg", "image/png", "image/webp");

    public UserEntity uploadAvatar(UUID userId, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo de imagem é obrigatório");
        }
        if (!ALLOWED.contains(file.getContentType())) {
            throw new IllegalArgumentException("Formato inválido. Use JPG, PNG ou WEBP.");
        }
        if (file.getSize() > 5 * 1024 * 1024) { // 5MB
            throw new IllegalArgumentException("Arquivo muito grande (máximo 5MB).");
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

        // Lê a imagem
        BufferedImage original = ImageIO.read(file.getInputStream());
        if (original == null) throw new IllegalArgumentException("Imagem inválida/corrompida.");

        // Redimensiona para no máximo 512x512 mantendo proporção
        int max = 512;
        int w = original.getWidth(), h = original.getHeight();
        double scale = Math.min(1.0, (double) max / Math.max(w, h));
        int nw = (int) Math.round(w * scale);
        int nh = (int) Math.round(h * scale);

        Image scaled = original.getScaledInstance(nw, nh, Image.SCALE_SMOOTH);
        BufferedImage out = new BufferedImage(nw, nh, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = out.createGraphics();
        g.setComposite(AlphaComposite.Src);
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.drawImage(scaled, 0, 0, null);
        g.dispose();

        // Define destino (pasta por usuário)
        Path userDir = Paths.get(mediaLocalPath, user.getUserId().toString());
        Files.createDirectories(userDir);

        // Salva como JPG para simplificar compatibilidade (se quiser WEBP, use plugin)
        String filename = "avatar_" + System.currentTimeMillis() + ".jpg";
        Path target = userDir.resolve(filename);

        try (OutputStream os = Files.newOutputStream(target)) {
            ImageIO.write(out, "jpg", os);
        }

        // Opcional: apagar arquivo antigo se era local
        deleteOldFileIfLocal(user.getProfileImageUrl());

        // Monta URL pública
        String publicUrl = String.format("%s/%s/%s", mediaBaseUrl, user.getUserId(), filename)
                .replace("//", "/"); // normaliza

        user.setProfileImageUrl(publicUrl);
        return userRepository.save(user);
    }

    public UserEntity removeAvatar(UUID userId) throws IOException {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

        deleteOldFileIfLocal(user.getProfileImageUrl());
        user.setProfileImageUrl(null);
        return userRepository.save(user);
    }

    private void deleteOldFileIfLocal(String url) throws IOException {
        if (url == null) return;
        // se começa com /media/ consideramos local
        if (url.startsWith("/media/")) {
            String relative = url.replaceFirst("^/media/", ""); // userId/arquivo.jpg
            Path file = Paths.get(mediaLocalPath, relative);
            try {
                Files.deleteIfExists(file);
            } catch (Exception ignored) {}
        }
    }
}

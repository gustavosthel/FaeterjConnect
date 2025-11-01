package com.faeterjconnect.faeterjconnect.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.faeterjconnect.faeterjconnect.model.UserEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Service
public class TokenService {

    @Value("${api.security.token.secret}")
    private String secret;

    @Value("${api.security.token.issuer}")
    private String issuer;

    @Value("${api.security.token.expiration-hours}")
    private long expirationHours;

    public String generateToken(UserEntity user) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secret);
            return JWT.create()
                    .withIssuer(issuer)
                    .withSubject(user.getEmail()) // subject = email
                    .withExpiresAt(generateExpireDate())
                    .sign(algorithm);
        } catch (JWTCreationException exception) {
            throw new RuntimeException("Error generating Token", exception);
        }
    }

    /**
     * Método legado: valida e retorna o subject (email) ou null se inválido.
     * Mantido para compatibilidade com código existente.
     */
    public String validateToken(String token) {
        if (token == null || token.isBlank()) return null;
        try {
            token = stripBearer(token);
            Algorithm algorithm = Algorithm.HMAC256(secret);
            return JWT.require(algorithm)
                    .withIssuer(issuer)
                    // .acceptLeeway(2) // opcional: tolerância de clock em segundos
                    .build()
                    .verify(token)
                    .getSubject();
        } catch (JWTVerificationException exception) {
            return null;
        }
    }

    /**
     * Novo método: valida o token e retorna SEMPRE o subject (email) se for válido.
     * Lança JWTVerificationException (ou subclasse) quando inválido/expirado.
     * Ideal para fluxos onde você quer falhar explicitamente (ex.: WebSocket CONNECT).
     */
    public String validateAndGetSubject(String token) {
        if (token == null || token.isBlank()) {
            throw new JWTVerificationException("Token ausente ou vazio");
        }
        try {
            token = stripBearer(token);
            Algorithm algorithm = Algorithm.HMAC256(secret);
            var verifier = JWT.require(algorithm)
                    .withIssuer(issuer)
                    // .acceptLeeway(2) // opcional: tolerância de 2s
                    .build();
            var decoded = verifier.verify(token); // verifica assinatura, issuer e expiração
            String subject = decoded.getSubject();
            if (subject == null || subject.isBlank()) {
                throw new JWTVerificationException("Subject ausente no token");
            }
            return subject; // <- email
        } catch (JWTVerificationException e) {
            // Repassa a exceção para o chamador lidar (ex.: 401/403)
            throw e;
        } catch (Exception e) {
            // Qualquer outra falha inesperada
            throw new JWTVerificationException("Falha ao validar token: " + e.getMessage());
        }
    }

    private String stripBearer(String token) {
        return token.startsWith("Bearer ") ? token.substring(7) : token;
    }

    private Instant generateExpireDate() {
        // Use o offset da sua região (Rio = -03:00)
        return LocalDateTime.now()
                .plusHours(expirationHours)
                .toInstant(ZoneOffset.of("-03:00"));
    }
}
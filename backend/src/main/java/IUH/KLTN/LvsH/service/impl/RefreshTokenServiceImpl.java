package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.entity.RefreshToken;
import IUH.KLTN.LvsH.entity.Staff;
import IUH.KLTN.LvsH.repository.RefreshTokenRepository;
import IUH.KLTN.LvsH.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class RefreshTokenServiceImpl implements RefreshTokenService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${app.security.jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationInMs;

    @Override
    public long getRefreshTokenExpirationInMs() {
        return refreshTokenExpirationInMs;
    }

    @Override
    public String issueRefreshToken(Staff staff) {
        revokeAllActiveTokens(staff);

        String rawToken = generateRawToken();
        RefreshToken refreshToken = RefreshToken.builder()
                .staff(staff)
                .tokenHash(hashToken(rawToken))
                .expiresAt(LocalDateTime.now().plusNanos(refreshTokenExpirationInMs * 1_000_000L))
                .build();
        refreshTokenRepository.save(refreshToken);
        return rawToken;
    }

    @Override
    public RefreshToken validateAndMarkUsed(String rawToken) {
        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(hashToken(rawToken))
                .filter(token -> token.getRevokedAt() == null)
                .filter(token -> token.getExpiresAt().isAfter(LocalDateTime.now()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token is invalid or expired"));

        refreshToken.setLastUsedAt(LocalDateTime.now());
        return refreshTokenRepository.save(refreshToken);
    }

    @Override
    public void revokeByRawToken(String rawToken) {
        refreshTokenRepository.findByTokenHash(hashToken(rawToken)).ifPresent(refreshToken -> {
            if (refreshToken.getRevokedAt() == null) {
                refreshToken.setRevokedAt(LocalDateTime.now());
                refreshTokenRepository.save(refreshToken);
            }
        });
    }

    @Override
    public void revokeAllActiveTokens(Staff staff) {
        List<RefreshToken> activeTokens = refreshTokenRepository.findAllByStaff_IdAndRevokedAtIsNull(staff.getId());
        if (activeTokens.isEmpty()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        activeTokens.forEach(token -> token.setRevokedAt(now));
        refreshTokenRepository.saveAll(activeTokens);
    }

    private String generateRawToken() {
        byte[] tokenBytes = new byte[64];
        SECURE_RANDOM.nextBytes(tokenBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm is not available", e);
        }
    }
}

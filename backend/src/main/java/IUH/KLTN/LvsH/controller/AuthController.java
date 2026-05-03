package IUH.KLTN.LvsH.controller;

import IUH.KLTN.LvsH.dto.AuthRequestDTO;
import IUH.KLTN.LvsH.dto.AuthResponseDTO;
import IUH.KLTN.LvsH.dto.RefreshTokenRequestDTO;
import IUH.KLTN.LvsH.service.AuthService;
import IUH.KLTN.LvsH.service.LoginRateLimitService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;
import jakarta.validation.Valid;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;
import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

        private static final String CLIENT_PLATFORM_HEADER = "X-Client-Platform";
        private static final String WEB_PLATFORM = "web";
        private static final String REFRESH_COOKIE_NAME = "refresh_token";

        private final AuthService authService;
        private final LoginRateLimitService loginRateLimitService;

        @Value("${app.security.jwt.refresh-token-cookie-secure:false}")
        private boolean refreshTokenCookieSecure;

        @Value("${app.security.jwt.refresh-token-expiration-ms:604800000}")
        private long refreshTokenExpirationInMs;

    @PostMapping("/login")
        public ResponseEntity<AuthResponseDTO> authenticateUser(@Valid @RequestBody AuthRequestDTO loginRequest,
                HttpServletRequest request) {
                String clientIp = resolveClientIp(request);
                loginRateLimitService.assertAllowed(clientIp);

                try {
                        AuthResponseDTO response = authService.login(loginRequest);
                        loginRateLimitService.reset(clientIp);
                        return buildAuthResponse(response, isWebClient(request));
                } catch (AuthenticationException ex) {
                        loginRateLimitService.recordFailure(clientIp);
                        throw ex;
                }
        }


        @PostMapping("/refresh")
                public ResponseEntity<AuthResponseDTO> refreshToken(@RequestBody(required = false) RefreshTokenRequestDTO refreshTokenRequest,
                                                                                                                        HttpServletRequest request) {
                                String rawRefreshToken = resolveRefreshToken(refreshTokenRequest, request, true);
                                RefreshTokenRequestDTO resolvedRequest = new RefreshTokenRequestDTO();
                                resolvedRequest.setRefreshToken(rawRefreshToken);

                                AuthResponseDTO response = authService.refresh(resolvedRequest);
                                return buildAuthResponse(response, isWebClient(request));
        }

        @PostMapping("/logout")
                public ResponseEntity<Map<String, String>> logout(@RequestBody(required = false) RefreshTokenRequestDTO refreshTokenRequest,
                                                                                                                 HttpServletRequest request) {
                                String rawRefreshToken = resolveRefreshToken(refreshTokenRequest, request, false);
                                authService.logout(rawRefreshToken == null ? null : buildRefreshTokenRequest(rawRefreshToken));

                                ResponseEntity.BodyBuilder builder = ResponseEntity.ok();
                                if (isWebClient(request)) {
                                        builder.header(HttpHeaders.SET_COOKIE, buildExpiredRefreshTokenCookie().toString());
                                }
                                return builder.body(Map.of("message", "Logged out successfully"));
        }

        private ResponseEntity<AuthResponseDTO> buildAuthResponse(AuthResponseDTO response, boolean webClient) {
                ResponseEntity.BodyBuilder builder = ResponseEntity.ok();

                if (webClient && response.getRefreshToken() != null && !response.getRefreshToken().isBlank()) {
                        builder.header(HttpHeaders.SET_COOKIE, buildRefreshTokenCookie(response.getRefreshToken()).toString());
                        response = AuthResponseDTO.builder()
                                        .accessToken(response.getAccessToken())
                                        .refreshToken(null)
                                        .tokenType(response.getTokenType())
                                        .username(response.getUsername())
                                        .role(response.getRole())
                                        .accessTokenExpiresInMs(response.getAccessTokenExpiresInMs())
                                        .refreshTokenExpiresInMs(response.getRefreshTokenExpiresInMs())
                                        .build();
                }

                return builder.body(response);
        }

        private boolean isWebClient(HttpServletRequest request) {
                return WEB_PLATFORM.equalsIgnoreCase(request.getHeader(CLIENT_PLATFORM_HEADER));
        }

        private String resolveRefreshToken(RefreshTokenRequestDTO requestDTO, HttpServletRequest request, boolean required) {
                String tokenFromBody = requestDTO == null ? null : requestDTO.getRefreshToken();
                if (tokenFromBody != null && !tokenFromBody.isBlank()) {
                        return tokenFromBody;
                }

                String tokenFromCookie = resolveRefreshTokenFromCookie(request);
                if (tokenFromCookie != null && !tokenFromCookie.isBlank()) {
                        return tokenFromCookie;
                }

                if (required) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Refresh token is required");
                }

                return null;
        }

        private String resolveRefreshTokenFromCookie(HttpServletRequest request) {
                Cookie[] cookies = request.getCookies();
                if (cookies == null) {
                        return null;
                }

                for (Cookie cookie : cookies) {
                        if (REFRESH_COOKIE_NAME.equals(cookie.getName())) {
                                return cookie.getValue();
                        }
                }
                return null;
        }

        private RefreshTokenRequestDTO buildRefreshTokenRequest(String rawRefreshToken) {
                RefreshTokenRequestDTO requestDTO = new RefreshTokenRequestDTO();
                requestDTO.setRefreshToken(rawRefreshToken);
                return requestDTO;
        }

        private ResponseCookie buildRefreshTokenCookie(String rawRefreshToken) {
                return ResponseCookie.from(REFRESH_COOKIE_NAME, rawRefreshToken)
                                .httpOnly(true)
                                .secure(refreshTokenCookieSecure)
                                .sameSite("Lax")
                                .path("/api/auth")
                                .maxAge(Duration.ofMillis(refreshTokenExpirationInMs))
                                .build();
        }

        private ResponseCookie buildExpiredRefreshTokenCookie() {
                return ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                                .httpOnly(true)
                                .secure(refreshTokenCookieSecure)
                                .sameSite("Lax")
                                .path("/api/auth")
                                .maxAge(Duration.ZERO)
                                .build();
        }

        private String resolveClientIp(HttpServletRequest request) {
                String forwardedFor = request.getHeader("X-Forwarded-For");
                if (forwardedFor != null && !forwardedFor.isBlank()) {
                        return forwardedFor.split(",")[0].trim();
                }
                return request.getRemoteAddr();
        }
}

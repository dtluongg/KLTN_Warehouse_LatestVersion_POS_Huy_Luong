package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.dto.AuthRequestDTO;
import IUH.KLTN.LvsH.dto.AuthResponseDTO;
import IUH.KLTN.LvsH.dto.RefreshTokenRequestDTO;
import IUH.KLTN.LvsH.entity.RefreshToken;
import IUH.KLTN.LvsH.entity.Staff;
import IUH.KLTN.LvsH.security.CustomUserDetails;
import IUH.KLTN.LvsH.security.CustomUserDetailsService;
import IUH.KLTN.LvsH.security.JwtTokenProvider;
import IUH.KLTN.LvsH.service.AuthService;
import IUH.KLTN.LvsH.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthServiceImpl implements AuthService {

    private static final String TOKEN_TYPE = "Bearer";

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final CustomUserDetailsService customUserDetailsService;

    @Override
    public AuthResponseDTO login(AuthRequestDTO loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String accessToken = tokenProvider.generateAccessToken(authentication);
        String refreshToken = refreshTokenService.issueRefreshToken(userDetails.getStaff());

        return buildResponse(userDetails, accessToken, refreshToken);
    }

    @Override
    public AuthResponseDTO refresh(RefreshTokenRequestDTO refreshTokenRequest) {
        RefreshToken existingRefreshToken = refreshTokenService.validateAndMarkUsed(refreshTokenRequest.getRefreshToken());
        Staff staff = existingRefreshToken.getStaff();

        refreshTokenService.revokeByRawToken(refreshTokenRequest.getRefreshToken());

        CustomUserDetails userDetails = (CustomUserDetails) customUserDetailsService.loadUserByUsername(staff.getUsername());
        String accessToken = tokenProvider.generateAccessToken(userDetails);
        String nextRefreshToken = refreshTokenService.issueRefreshToken(staff);

        return buildResponse(userDetails, accessToken, nextRefreshToken);
    }

    @Override
    public void logout(RefreshTokenRequestDTO refreshTokenRequest) {
        if (refreshTokenRequest != null && refreshTokenRequest.getRefreshToken() != null && !refreshTokenRequest.getRefreshToken().isBlank()) {
            refreshTokenService.revokeByRawToken(refreshTokenRequest.getRefreshToken());
        }
        SecurityContextHolder.clearContext();
    }

    private AuthResponseDTO buildResponse(CustomUserDetails userDetails, String accessToken, String refreshToken) {
        return AuthResponseDTO.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType(TOKEN_TYPE)
                .username(userDetails.getUsername())
                .role(userDetails.getStaff().getRole().name())
                .accessTokenExpiresInMs(tokenProvider.getAccessTokenExpirationInMs())
                .refreshTokenExpiresInMs(refreshTokenService.getRefreshTokenExpirationInMs())
                .build();
    }
}
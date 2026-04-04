package IUH.KLTN.LvsH.controller;

import IUH.KLTN.LvsH.dto.AuthRequestDTO;
import IUH.KLTN.LvsH.dto.AuthResponseDTO;
import IUH.KLTN.LvsH.security.CustomUserDetails;
import IUH.KLTN.LvsH.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.Map;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> authenticateUser(@Valid @RequestBody AuthRequestDTO loginRequest) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = tokenProvider.generateToken(authentication);
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        return ResponseEntity.ok(AuthResponseDTO.builder()
                .token(jwt)
                .username(userDetails.getUsername())
                .role(userDetails.getStaff().getRole())
                .build());
     }

        @PostMapping("/logout")
        @PreAuthorize("isAuthenticated()")
        public ResponseEntity<Map<String, String>> logout() {
                // JWT is stateless; server-side logout means clearing security context.
                SecurityContextHolder.clearContext();
                return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
        }
}

package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.dto.AuthRequestDTO;
import IUH.KLTN.LvsH.dto.AuthResponseDTO;
import IUH.KLTN.LvsH.dto.RefreshTokenRequestDTO;

public interface AuthService {
    AuthResponseDTO login(AuthRequestDTO loginRequest);
    AuthResponseDTO refresh(RefreshTokenRequestDTO refreshTokenRequest);
    void logout(RefreshTokenRequestDTO refreshTokenRequest);
}
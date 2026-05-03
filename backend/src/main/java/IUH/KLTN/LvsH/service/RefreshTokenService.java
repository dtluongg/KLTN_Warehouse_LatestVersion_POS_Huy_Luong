package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.entity.RefreshToken;
import IUH.KLTN.LvsH.entity.Staff;

public interface RefreshTokenService {
    long getRefreshTokenExpirationInMs();

    String issueRefreshToken(Staff staff);

    RefreshToken validateAndMarkUsed(String rawToken);

    void revokeByRawToken(String rawToken);

    void revokeAllActiveTokens(Staff staff);
}
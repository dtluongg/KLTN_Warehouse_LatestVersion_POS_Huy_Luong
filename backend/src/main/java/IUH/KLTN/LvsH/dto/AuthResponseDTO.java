package IUH.KLTN.LvsH.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponseDTO {
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private String username;
    private String role;
    private long accessTokenExpiresInMs;
    private long refreshTokenExpiresInMs;
}

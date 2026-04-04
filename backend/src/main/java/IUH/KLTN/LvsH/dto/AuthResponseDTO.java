package IUH.KLTN.LvsH.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class AuthResponseDTO {
    private String token;
    private String username;
    private String role;
}

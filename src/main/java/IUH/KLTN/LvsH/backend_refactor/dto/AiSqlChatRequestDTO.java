package IUH.KLTN.LvsH.backend_refactor.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AiSqlChatRequestDTO {

    @NotBlank(message = "question is required")
    private String question;
}

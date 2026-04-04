package IUH.KLTN.LvsH.backend_refactor.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class AiSqlChatResponseDTO {
    private String question;
    private String sql;
    private String answer;
    private String summary;
    private int rowCount;
    private List<Map<String, Object>> rows;
}

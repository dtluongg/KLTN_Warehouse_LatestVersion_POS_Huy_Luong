package IUH.KLTN.LvsH.backend_refactor.service;

import IUH.KLTN.LvsH.backend_refactor.dto.AiSqlChatResponseDTO;

public interface AiSqlChatService {
    AiSqlChatResponseDTO ask(String question);
}

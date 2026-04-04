package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.dto.AiSqlChatResponseDTO;

public interface AiSqlChatService {
    AiSqlChatResponseDTO ask(String question);
}

package com.pos.service;

import com.pos.dto.AiSqlChatResponseDTO;

public interface AiSqlChatService {
    AiSqlChatResponseDTO ask(String question);
}

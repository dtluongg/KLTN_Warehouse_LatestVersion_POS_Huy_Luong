package IUH.KLTN.LvsH.backend_refactor.controller;

import IUH.KLTN.LvsH.backend_refactor.dto.AiSqlChatRequestDTO;
import IUH.KLTN.LvsH.backend_refactor.dto.AiSqlChatResponseDTO;
import IUH.KLTN.LvsH.backend_refactor.service.AiSqlChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF', 'WAREHOUSE_STAFF')")
public class AiSqlChatController {

    private final AiSqlChatService aiSqlChatService;

    @PostMapping("/sql-chat")
    public ResponseEntity<AiSqlChatResponseDTO> ask(@Valid @RequestBody AiSqlChatRequestDTO request) {
        return ResponseEntity.ok(aiSqlChatService.ask(request.getQuestion()));
    }
}

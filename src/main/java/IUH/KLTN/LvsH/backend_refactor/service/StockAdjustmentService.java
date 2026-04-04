package IUH.KLTN.LvsH.backend_refactor.service;

import IUH.KLTN.LvsH.backend_refactor.dto.StockAdjustmentRequestDTO;
import IUH.KLTN.LvsH.backend_refactor.dto.StockAdjustmentResponseDTO;
import IUH.KLTN.LvsH.backend_refactor.entity.StockAdjustment;

import java.util.List;

public interface StockAdjustmentService {
    List<StockAdjustment> getAllAdjustments();
    StockAdjustment getAdjustmentById(Long id);
    StockAdjustmentResponseDTO createAdjustment(StockAdjustmentRequestDTO dto);
    StockAdjustmentResponseDTO updateDraftAdjustment(Long id, StockAdjustmentRequestDTO dto);
    StockAdjustmentResponseDTO completeAdjustment(Long id);
}

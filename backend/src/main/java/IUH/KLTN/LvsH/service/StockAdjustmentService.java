package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.dto.StockAdjustmentRequestDTO;
import IUH.KLTN.LvsH.dto.StockAdjustmentResponseDTO;
import IUH.KLTN.LvsH.entity.StockAdjustment;

import java.util.List;

public interface StockAdjustmentService {
    List<StockAdjustment> getAllAdjustments();
    StockAdjustment getAdjustmentById(Long id);
    StockAdjustmentResponseDTO createAdjustment(StockAdjustmentRequestDTO dto);
    StockAdjustmentResponseDTO updateDraftAdjustment(Long id, StockAdjustmentRequestDTO dto);
    StockAdjustmentResponseDTO completeAdjustment(Long id);
}

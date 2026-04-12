package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.dto.stock_adjustment.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface StockAdjustmentService {
    Page<StockAdjustmentListResponseDTO> getAllAdjustments(StockAdjustmentSearchCriteria criteria, Pageable pageable);
    StockAdjustmentDetailResponseDTO getAdjustmentDetailById(Long id);
    StockAdjustmentDetailResponseDTO createAdjustment(StockAdjustmentRequestDTO request);
    StockAdjustmentDetailResponseDTO updateDraftAdjustment(Long id, StockAdjustmentRequestDTO request);
    StockAdjustmentDetailResponseDTO completeAdjustment(Long id, boolean forceCompleteWhenDrift);
    StockAdjustmentDetailResponseDTO cancelDraftAdjustment(Long id);
}

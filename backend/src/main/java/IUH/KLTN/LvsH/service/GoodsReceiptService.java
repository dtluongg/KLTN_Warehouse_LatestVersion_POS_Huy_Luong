package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.dto.goods_receipt.*;
import IUH.KLTN.LvsH.entity.GoodsReceipt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface GoodsReceiptService {
    Page<GoodsReceiptListResponseDTO> getAllGoodsReceipts(GoodsReceiptSearchCriteria criteria, Pageable pageable);
    GoodsReceiptDetailResponseDTO getGoodsReceiptDetailById(Long id);
    GoodsReceiptDetailResponseDTO createGoodsReceipt(GoodsReceiptRequestDTO dto);
    GoodsReceiptDetailResponseDTO updateDraftGoodsReceipt(Long id, GoodsReceiptRequestDTO dto);
    GoodsReceiptDetailResponseDTO completeGoodsReceipt(Long id);
    GoodsReceiptDetailResponseDTO cancelGoodsReceipt(Long id);
    
    // Internal method
    GoodsReceipt getGoodsReceiptById(Long id);
}

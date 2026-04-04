package IUH.KLTN.LvsH.backend_refactor.service;

import IUH.KLTN.LvsH.backend_refactor.dto.GoodsReceiptRequestDTO;
import IUH.KLTN.LvsH.backend_refactor.dto.GoodsReceiptResponseDTO;
import IUH.KLTN.LvsH.backend_refactor.entity.GoodsReceipt;

import java.util.List;

public interface GoodsReceiptService {
    List<GoodsReceipt> getAllGoodsReceipts();
    GoodsReceipt getGoodsReceiptById(Long id);
    GoodsReceiptResponseDTO createGoodsReceipt(GoodsReceiptRequestDTO dto);
    GoodsReceiptResponseDTO updateDraftGoodsReceipt(Long id, GoodsReceiptRequestDTO dto);
    GoodsReceiptResponseDTO completeGoodsReceipt(Long id);
}

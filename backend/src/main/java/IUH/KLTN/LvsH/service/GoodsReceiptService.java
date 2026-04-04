package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.dto.GoodsReceiptRequestDTO;
import IUH.KLTN.LvsH.dto.GoodsReceiptResponseDTO;
import IUH.KLTN.LvsH.entity.GoodsReceipt;

import java.util.List;

public interface GoodsReceiptService {
    List<GoodsReceipt> getAllGoodsReceipts();
    GoodsReceipt getGoodsReceiptById(Long id);
    GoodsReceiptResponseDTO createGoodsReceipt(GoodsReceiptRequestDTO dto);
    GoodsReceiptResponseDTO updateDraftGoodsReceipt(Long id, GoodsReceiptRequestDTO dto);
    GoodsReceiptResponseDTO completeGoodsReceipt(Long id);
}

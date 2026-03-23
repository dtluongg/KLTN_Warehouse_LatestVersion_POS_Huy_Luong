package com.pos.service;

import com.pos.dto.CreateGoodsReceiptDto;
import com.pos.dto.GoodsReceiptResponseDTO;
import com.pos.entity.GoodsReceipt;

import java.util.List;

public interface GoodsReceiptService {
    List<GoodsReceipt> getAllGoodsReceipts();
    GoodsReceipt getGoodsReceiptById(Long id);
    GoodsReceiptResponseDTO createGoodsReceipt(CreateGoodsReceiptDto dto);
    GoodsReceiptResponseDTO completeGoodsReceipt(Long id);
}

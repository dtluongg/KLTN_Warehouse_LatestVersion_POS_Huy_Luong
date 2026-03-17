package com.pos.service;

import com.pos.dto.CreateGoodsReceiptDto;
import com.pos.entity.GoodsReceipt;

import java.util.List;

public interface GoodsReceiptService {
    List<GoodsReceipt> getAllGoodsReceipts();
    GoodsReceipt getGoodsReceiptById(Long id);
    GoodsReceipt createGoodsReceipt(CreateGoodsReceiptDto dto);
    GoodsReceipt completeGoodsReceipt(Long id);
}

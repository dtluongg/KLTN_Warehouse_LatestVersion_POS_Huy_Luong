package com.pos.service;

import com.pos.dto.CreateStockAdjustmentDto;
import com.pos.entity.StockAdjustment;

import java.util.List;

public interface StockAdjustmentService {
    List<StockAdjustment> getAllAdjustments();
    StockAdjustment getAdjustmentById(Long id);
    StockAdjustment createAdjustment(CreateStockAdjustmentDto dto);
    StockAdjustment completeAdjustment(Long id);
}
